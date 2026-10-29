/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import { randomBytes } from "node:crypto";

import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type CookieOptions } from "express";
import rateLimit from "express-rate-limit";

import { generateCsrfToken, isValidCsrfToken } from "./csrf";
import { generatePkcePair } from "./pkce";

// ── Types ───────────────────────────────────────────────────────────────────
interface SessionData {
  refreshToken: string;
  idToken: string | null;
  csrfToken: string;
  createdAt: number;
}

interface PendingLogin {
  codeVerifier: string;
  createdAt: number;
}

interface TokenResponse {
  accessToken: string;
  expiresIn: number;
  refreshToken: string | undefined;
  idToken: string | undefined;
}

type RefreshOutcome =
  | { kind: "success"; accessToken: string; expiresIn: number }
  | { kind: "rejected" }
  | { kind: "failed" };

const MAX_PENDING_LOGINS = 10_000;
const MAX_SESSIONS = 10_000;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

function optionalNonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value !== "" ? value : undefined;
}

/** Returns the token response fields the app relies on, or undefined if any required field is missing. */
function parseTokenResponse(body: unknown): TokenResponse | undefined {
  if (typeof body !== "object" || body === null) {
    return undefined;
  }
  const fields = body as Record<string, unknown>;
  const accessToken = optionalNonEmptyString(fields.access_token);
  if (accessToken === undefined || typeof fields.expires_in !== "number") {
    return undefined;
  }
  return {
    accessToken,
    expiresIn: fields.expires_in,
    refreshToken: optionalNonEmptyString(fields.refresh_token),
    idToken: optionalNonEmptyString(fields.id_token),
  };
}

/** Reads the OAuth `error` code from a failed token response, without logging anything else from the body. */
async function readOAuthErrorCode(response: globalThis.Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (typeof body === "object" && body !== null) {
      const errorCode = (body as Record<string, unknown>).error;
      if (typeof errorCode === "string" && /^[a-z_]{1,64}$/.test(errorCode)) {
        return errorCode;
      }
    }
  } catch {
    // Not JSON — fall through.
  }
  return "unknown_error";
}

/** Insert into a Map, evicting the oldest entries (insertion order) when it is full. */
function setWithLimit<Key, Value>(
  map: Map<Key, Value>,
  key: Key,
  value: Value,
  limit: number,
): void {
  while (map.size >= limit) {
    const oldest = map.keys().next();
    if (oldest.done === true) {
      break;
    }
    map.delete(oldest.value);
  }
  map.set(key, value);
}

// ── App factory ─────────────────────────────────────────────────────────────
export function createApp(): {
  app: express.Express;
  sessions: Map<string, SessionData>;
  pendingStates: Map<string, PendingLogin>;
} {
  const CLIENT_ID = process.env.OAUTH2_CLIENT_ID as string;
  const CLIENT_SECRET = process.env.OAUTH2_CLIENT_SECRET as string;
  const AUTH_URL = process.env.OAUTH2_AUTHORIZATION_URL as string;
  const TOKEN_URL = process.env.OAUTH2_TOKEN_URL as string;
  const REDIRECT_URI = process.env.OAUTH2_REDIRECT_URI as string;
  const FRONTEND_ORIGIN = process.env.CORS_ORIGIN as string;
  const SCOPES = process.env.OAUTH2_SCOPES ?? "openid offline video_service";

  // ── Session & cookie configuration ────────────────────────────────────────
  const SESSION_COOKIE_NAME = "ref_app_sid";
  const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
  const STATE_COOKIE_NAME = "ref_app_oauth_state";
  const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes
  const IS_PRODUCTION = process.env.NODE_ENV === "production";

  const sessionCookieOptions: CookieOptions = {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS,
  };

  const stateCookieOptions: CookieOptions = {
    httpOnly: true,
    secure: IS_PRODUCTION,
    // "lax" so the cookie survives the top-level redirect back from the authorization server.
    sameSite: "lax",
    path: "/",
    maxAge: STATE_TTL_MS,
  };

  // In-memory session store (sessionId → session data)
  const sessions = new Map<string, SessionData>();

  function createSession(refreshToken: string, idToken: string | null): string {
    const sessionId = randomBytes(32).toString("hex");
    setWithLimit(
      sessions,
      sessionId,
      { refreshToken, idToken, csrfToken: generateCsrfToken(), createdAt: Date.now() },
      MAX_SESSIONS,
    );
    return sessionId;
  }

  /** Read the session ID from the request's session cookie, if present. */
  function getSessionId(req: express.Request): string | undefined {
    const sessionId = req.cookies?.[SESSION_COOKIE_NAME];
    return typeof sessionId === "string" && sessionId !== "" ? sessionId : undefined;
  }

  // ── Express app ───────────────────────────────────────────────────────────
  const app = express();

  app.disable("x-powered-by");

  app.use(cookieParser());
  app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
  app.use((_req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });

  const createLimiter = (limit: number) =>
    rateLimit({
      windowMs: RATE_LIMIT_WINDOW_MS,
      limit,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: "Too many requests, please try again later", code: "RATE_LIMITED" },
    });

  const loginLimiter = createLimiter(30);
  // Higher limit: short-lived access tokens make every open tab refresh about once a minute.
  const sessionLimiter = createLimiter(300);

  // In-memory login transaction store (state → PKCE code verifier)
  const pendingStates = new Map<string, PendingLogin>();

  /** Consume the login transaction for `state`, only if this browser started it. */
  function takePendingLogin(req: express.Request, state: unknown): PendingLogin | undefined {
    const stateCookie = req.cookies?.[STATE_COOKIE_NAME];
    if (
      typeof state !== "string" ||
      typeof stateCookie !== "string" ||
      !isValidCsrfToken(stateCookie, state)
    ) {
      return undefined;
    }
    const pendingLogin = pendingStates.get(state);
    pendingStates.delete(state);
    return pendingLogin;
  }

  // Clean up expired login transactions (10 min) and sessions (24 h)
  setInterval(() => {
    const stateCutoff = Date.now() - STATE_TTL_MS;
    for (const [state, pendingLogin] of pendingStates) {
      if (pendingLogin.createdAt < stateCutoff) {
        pendingStates.delete(state);
      }
    }

    const sessionCutoff = Date.now() - SESSION_TTL_MS;
    for (const [sessionId, session] of sessions) {
      if (session.createdAt < sessionCutoff) {
        sessions.delete(sessionId);
      }
    }
  }, STATE_TTL_MS).unref();

  /** Call the OAuth 2.0 token endpoint, authenticating with HTTP Basic auth. */
  async function requestTokens(bodyParams: Record<string, string>): Promise<globalThis.Response> {
    const basicAuth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
    return fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams(bodyParams).toString(),
    });
  }

  // One refresh per session at a time: parallel tabs reusing a rotated refresh token can get the session revoked.
  const refreshesInFlight = new Map<string, Promise<RefreshOutcome>>();

  async function refreshSession(sessionId: string, session: SessionData): Promise<RefreshOutcome> {
    try {
      const response = await requestTokens({
        grant_type: "refresh_token",
        refresh_token: session.refreshToken,
      });

      if (!response.ok) {
        console.warn(
          "Token refresh rejected:",
          response.status,
          await readOAuthErrorCode(response),
        );
        sessions.delete(sessionId);
        return { kind: "rejected" };
      }

      const tokens = parseTokenResponse(await response.json());
      if (tokens === undefined) {
        console.error("Token refresh returned an incomplete token response");
        return { kind: "failed" };
      }

      if (tokens.refreshToken !== undefined) {
        session.refreshToken = tokens.refreshToken;
      }
      if (tokens.idToken !== undefined) {
        session.idToken = tokens.idToken;
      }
      return { kind: "success", accessToken: tokens.accessToken, expiresIn: tokens.expiresIn };
    } catch (error) {
      console.error("Token refresh error:", error instanceof Error ? error.message : "unknown");
      return { kind: "failed" };
    }
  }

  function refreshSessionOnce(sessionId: string, session: SessionData): Promise<RefreshOutcome> {
    const inFlight = refreshesInFlight.get(sessionId);
    if (inFlight !== undefined) {
      return inFlight;
    }
    const refresh = refreshSession(sessionId, session).finally(() => {
      refreshesInFlight.delete(sessionId);
    });
    refreshesInFlight.set(sessionId, refresh);
    return refresh;
  }

  // ── Routes ────────────────────────────────────────────────────────────────

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  /** 1. Start OAuth2 login — redirect to authorization server */
  app.get("/auth/login", loginLimiter, (_req, res) => {
    const state = randomBytes(32).toString("hex");
    const { codeVerifier, codeChallenge } = generatePkcePair();
    setWithLimit(pendingStates, state, { codeVerifier, createdAt: Date.now() }, MAX_PENDING_LOGINS);
    res.cookie(STATE_COOKIE_NAME, state, stateCookieOptions);

    const params = new URLSearchParams({
      response_type: "code",
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: SCOPES,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    res.redirect(`${AUTH_URL}?${params.toString()}`);
  });

  /** 2. OAuth2 callback — exchange code for tokens, redirect to frontend */
  app.get("/callback", loginLimiter, async (req, res) => {
    const { code, state } = req.query;
    const pendingLogin = takePendingLogin(req, state);

    // Keep the cookie on mismatch so a login still in progress in another tab can finish.
    if (pendingLogin === undefined) {
      res.redirect(`${FRONTEND_ORIGIN}/error?code=INVALID_STATE`);
      return;
    }
    res.clearCookie(STATE_COOKIE_NAME, stateCookieOptions);

    if (typeof code !== "string" || code === "") {
      res.redirect(`${FRONTEND_ORIGIN}/error?code=MISSING_CODE`);
      return;
    }

    try {
      const response = await requestTokens({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
        code_verifier: pendingLogin.codeVerifier,
      });

      if (!response.ok) {
        console.error(
          "Token exchange failed:",
          response.status,
          await readOAuthErrorCode(response),
        );
        res.redirect(`${FRONTEND_ORIGIN}/error?code=TOKEN_EXCHANGE_FAILED`);
        return;
      }

      const tokens = parseTokenResponse(await response.json());
      if (tokens === undefined || tokens.refreshToken === undefined) {
        console.error(
          "Token exchange returned an incomplete token response (is the offline scope granted?)",
        );
        res.redirect(`${FRONTEND_ORIGIN}/error?code=TOKEN_EXCHANGE_FAILED`);
        return;
      }

      // Store refresh_token and id_token server-side; only send access_token to frontend
      const sessionId = createSession(tokens.refreshToken, tokens.idToken ?? null);
      res.cookie(SESSION_COOKIE_NAME, sessionId, sessionCookieOptions);

      const frontendTokens = {
        access_token: tokens.accessToken,
        expires_in: tokens.expiresIn,
      };
      const fragment = encodeURIComponent(JSON.stringify(frontendTokens));
      res.redirect(`${FRONTEND_ORIGIN}/#tokens=${fragment}`);
    } catch (error) {
      console.error("Token exchange error:", error instanceof Error ? error.message : "unknown");
      res.redirect(`${FRONTEND_ORIGIN}/error?code=TOKEN_EXCHANGE_FAILED`);
    }
  });

  /** 3. Refresh token — uses server-side session (cookie) to obtain new access_token */
  app.post("/api/refresh-token", sessionLimiter, async (req, res) => {
    const sessionId = getSessionId(req);
    if (sessionId === undefined) {
      res.status(401).json({ error: "No session" });
      return;
    }

    const session = sessions.get(sessionId);
    if (session === undefined) {
      res.clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions);
      res.status(401).json({ error: "Session expired" });
      return;
    }

    if (!isValidCsrfToken(session.csrfToken, req.get("X-CSRF-Token"))) {
      res.status(403).json({ error: "Invalid CSRF token", code: "INVALID_CSRF_TOKEN" });
      return;
    }

    const outcome = await refreshSessionOnce(sessionId, session);
    if (outcome.kind === "rejected") {
      res.clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions);
      res.status(401).json({ error: "Token refresh failed", code: "REFRESH_REJECTED" });
      return;
    }
    if (outcome.kind === "failed") {
      res.status(502).json({ error: "Token refresh failed", code: "REFRESH_FAILED" });
      return;
    }
    res.json({ access_token: outcome.accessToken, expires_in: outcome.expiresIn });
  });

  /** 4. Session info — returns decoded ID token claims from the server-side session */
  app.get("/api/session-info", sessionLimiter, (req, res) => {
    const sessionId = getSessionId(req);
    if (sessionId === undefined) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const session = sessions.get(sessionId);
    if (session === undefined) {
      res.clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions);
      res.status(401).json({ error: "Session expired" });
      return;
    }

    if (session.idToken === null) {
      res.status(404).json({ error: "No ID token available" });
      return;
    }

    try {
      // Signature not verified: the ID token came straight from the token endpoint over TLS (OIDC Core 3.1.3.7).
      const payloadSegment = session.idToken.split(".")[1];
      if (payloadSegment === undefined) {
        res.status(500).json({ error: "Malformed ID token" });
        return;
      }
      const claims = JSON.parse(Buffer.from(payloadSegment, "base64url").toString()) as Record<
        string,
        unknown
      >;

      res.json({
        sub: claims.sub ?? null,
        email: claims.email ?? null,
        name: claims.name ?? null,
        picture: claims.picture ?? null,
        "axis:organization": claims["axis:organization"] ?? null,
      });
    } catch {
      res.status(500).json({ error: "Failed to decode ID token" });
    }
  });

  /** 5. CSRF token — issues the session-bound token required to call state-changing endpoints */
  app.get("/api/csrf-token", sessionLimiter, (req, res) => {
    const sessionId = getSessionId(req);
    const session = sessionId !== undefined ? sessions.get(sessionId) : undefined;
    if (session === undefined) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    res.json({ csrf_token: session.csrfToken });
  });

  /** 6. Logout — clears server-side session and cookie */
  app.post("/auth/logout", sessionLimiter, (req, res) => {
    const sessionId = getSessionId(req);
    if (sessionId !== undefined) {
      const session = sessions.get(sessionId);
      if (session !== undefined) {
        if (!isValidCsrfToken(session.csrfToken, req.get("X-CSRF-Token"))) {
          res.status(403).json({ error: "Invalid CSRF token", code: "INVALID_CSRF_TOKEN" });
          return;
        }
        sessions.delete(sessionId);
      }
    }
    res.clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions);
    res.status(200).json({ status: "logged_out" });
  });

  // ── Error handling ────────────────────────────────────────────────────────
  app.use(
    (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error("Unhandled error:", err.message);
      res.status(500).json({ error: "An unexpected error occurred" });
    },
  );

  return { app, sessions, pendingStates };
}
