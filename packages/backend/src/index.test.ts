/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import http from "node:http";

import type { Express } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createApp } from "./index";

// ── Test environment ────────────────────────────────────────────────────────
const TEST_ENV = {
  OAUTH2_CLIENT_ID: "test-client-id",
  OAUTH2_CLIENT_SECRET: "test-client-secret",
  OAUTH2_AUTHORIZATION_URL: "https://auth.example.com/authorize",
  OAUTH2_TOKEN_URL: "https://auth.example.com/token",
  OAUTH2_REDIRECT_URI: "https://app.example.com/callback",
  CORS_ORIGIN: "https://app.example.com",
};

/** Build a minimal JWT with the given payload (header.payload.signature). */
const buildJwt = (payload: Record<string, unknown>): string => {
  const header = Buffer.from(JSON.stringify({ alg: "RS256" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${body}.fake-signature`;
};

/** HTTP helper using node:http so it is not affected by fetch mocks. */
const request = async (
  app: Express,
  method: string,
  path: string,
  options: { cookies?: string; headers?: Record<string, string> } = {},
): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: unknown }> => {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const address = server.address();
      if (address === null || typeof address === "string") {
        server.close();
        reject(new Error("Failed to get server address"));
        return;
      }
      const requestOptions: http.RequestOptions = {
        hostname: "127.0.0.1",
        port: address.port,
        path,
        method,
        headers: { ...options.headers },
      };
      if (options.cookies !== undefined) {
        requestOptions.headers = { ...requestOptions.headers, Cookie: options.cookies };
      }
      const req = http.request(requestOptions, (res) => {
        let data = "";
        res.on("data", (chunk: Buffer) => {
          data += chunk.toString();
        });
        res.on("end", () => {
          server.close();
          let body: unknown = data;
          const contentType = res.headers["content-type"] ?? "";
          if (contentType.includes("application/json") && data.length > 0) {
            body = JSON.parse(data);
          }
          resolve({ status: res.statusCode ?? 0, headers: res.headers, body });
        });
      });
      req.on("error", (error) => {
        server.close();
        reject(error);
      });
      req.end();
    });
  });
};

// ── Setup ───────────────────────────────────────────────────────────────────
interface TestSessionData {
  refreshToken: string;
  idToken: string | null;
  csrfToken: string;
  createdAt: number;
}

/** Drive a real login and return the redirect URL and the state cookie it set. */
const startLogin = async (
  targetApp: Express,
): Promise<{ state: string; stateCookie: string; location: URL }> => {
  const response = await request(targetApp, "GET", "/auth/login");
  const location = new URL(response.headers.location ?? "");
  const setCookie = response.headers["set-cookie"] ?? [];
  const stateCookie = setCookie.find((cookie) => cookie.startsWith("ref_app_oauth_state=")) ?? "";
  return {
    state: location.searchParams.get("state") ?? "",
    stateCookie: stateCookie.split(";")[0] ?? "",
    location,
  };
};

let app: Express;
let sessions: Map<string, TestSessionData>;
let pendingStates: Map<string, unknown>;

beforeEach(() => {
  for (const [key, value] of Object.entries(TEST_ENV)) {
    process.env[key] = value;
  }
  const created = createApp();
  app = created.app;
  sessions = created.sessions;
  pendingStates = created.pendingStates;
});

afterEach(() => {
  vi.restoreAllMocks();
  for (const key of Object.keys(TEST_ENV)) {
    delete process.env[key];
  }
});

// ── /callback — CSRF & token exchange ───────────────────────────────────────
describe("GET /callback", () => {
  it("should reject when state parameter is missing", async () => {
    const response = await request(app, "GET", "/callback?code=some-code");
    expect(response.status).toBe(302);
    expect(response.headers.location).toContain("/error?code=INVALID_STATE");
  });

  it("should reject when state does not match a pending state", async () => {
    const response = await request(app, "GET", "/callback?code=some-code&state=unknown-state", {
      cookies: "ref_app_oauth_state=unknown-state",
    });
    expect(response.status).toBe(302);
    expect(response.headers.location).toContain("/error?code=INVALID_STATE");
  });

  it("should reject a valid state when the browser has no state cookie (login CSRF)", async () => {
    const { state } = await startLogin(app);

    const response = await request(app, "GET", `/callback?code=auth-code&state=${state}`);
    expect(response.status).toBe(302);
    expect(response.headers.location).toContain("/error?code=INVALID_STATE");
  });

  it("should reject a valid state when the state cookie belongs to another login", async () => {
    const attackerLogin = await startLogin(app);
    const victimLogin = await startLogin(app);

    const response = await request(
      app,
      "GET",
      `/callback?code=auth-code&state=${attackerLogin.state}`,
      { cookies: victimLogin.stateCookie },
    );
    expect(response.status).toBe(302);
    expect(response.headers.location).toContain("/error?code=INVALID_STATE");
  });

  it("should keep the state cookie when the state does not match, so another tab can finish", async () => {
    const otherTabLogin = await startLogin(app);
    const currentTabLogin = await startLogin(app);

    const response = await request(
      app,
      "GET",
      `/callback?code=auth-code&state=${otherTabLogin.state}`,
      { cookies: currentTabLogin.stateCookie },
    );
    const setCookie = response.headers["set-cookie"] ?? [];
    expect(setCookie.some((cookie) => cookie.startsWith("ref_app_oauth_state="))).toBe(false);
  });

  it("should clear the state cookie after a matching callback", async () => {
    const { state, stateCookie } = await startLogin(app);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ access_token: "at", expires_in: 3600 })),
    );

    const response = await request(app, "GET", `/callback?code=auth-code&state=${state}`, {
      cookies: stateCookie,
    });
    const setCookie = response.headers["set-cookie"] ?? [];
    expect(setCookie.some((cookie) => cookie.startsWith("ref_app_oauth_state=;"))).toBe(true);
  });

  it("should set an HttpOnly SameSite=Lax state cookie on login", async () => {
    const response = await request(app, "GET", "/auth/login");
    const setCookie = response.headers["set-cookie"] ?? [];
    const stateCookie = setCookie.find((cookie) => cookie.startsWith("ref_app_oauth_state="));
    expect(stateCookie).toContain("HttpOnly");
    expect(stateCookie).toContain("SameSite=Lax");
  });

  it("should consume the CSRF state so it cannot be reused", async () => {
    const { state, stateCookie } = await startLogin(app);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          access_token: "at",
          expires_in: 3600,
          refresh_token: "rt",
          id_token: buildJwt({ sub: "user1" }),
        }),
      ),
    );

    await request(app, "GET", `/callback?code=auth-code&state=${state}`, { cookies: stateCookie });
    expect(pendingStates.has(state)).toBe(false);
  });

  it("should redirect with MISSING_CODE when code parameter is absent", async () => {
    const { state, stateCookie } = await startLogin(app);

    const response = await request(app, "GET", `/callback?state=${state}`, {
      cookies: stateCookie,
    });
    expect(response.status).toBe(302);
    expect(response.headers.location).toContain("/error?code=MISSING_CODE");
  });

  it("should redirect to frontend with access_token fragment on success", async () => {
    const { state, stateCookie } = await startLogin(app);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          access_token: "the-access-token",
          expires_in: 3600,
          refresh_token: "the-refresh-token",
          id_token: buildJwt({ sub: "user1" }),
        }),
      ),
    );

    const response = await request(app, "GET", `/callback?code=auth-code&state=${state}`, {
      cookies: stateCookie,
    });
    expect(response.status).toBe(302);

    const location = response.headers.location ?? "";
    expect(location).toContain("/#tokens=");

    const fragment = location.split("/#tokens=")[1] ?? "";
    const tokens = JSON.parse(decodeURIComponent(fragment));
    expect(tokens.access_token).toBe("the-access-token");
    expect(tokens.expires_in).toBe(3600);
    // refresh_token must NOT be in the fragment
    expect(tokens.refresh_token).toBeUndefined();
  });

  it("should create a server-side session storing the refresh token", async () => {
    const { state, stateCookie } = await startLogin(app);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          access_token: "at",
          expires_in: 3600,
          refresh_token: "stored-refresh-token",
        }),
      ),
    );

    await request(app, "GET", `/callback?code=auth-code&state=${state}`, { cookies: stateCookie });

    expect(sessions.size).toBe(1);
    const session = [...sessions.values()][0];
    expect(session.refreshToken).toBe("stored-refresh-token");
  });

  it("should redirect to error when token exchange HTTP request fails", async () => {
    const { state, stateCookie } = await startLogin(app);

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("bad request", { status: 400 })));

    const response = await request(app, "GET", `/callback?code=auth-code&state=${state}`, {
      cookies: stateCookie,
    });
    expect(response.status).toBe(302);
    expect(response.headers.location).toContain("/error?code=TOKEN_EXCHANGE_FAILED");
  });
});

// ── /api/refresh-token — session lifecycle ──────────────────────────────────
describe("POST /api/refresh-token", () => {
  it("should return 401 when no session cookie is present", async () => {
    const response = await request(app, "POST", "/api/refresh-token");
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "No session" });
  });

  it("should return 401 when session ID does not exist in the store", async () => {
    const response = await request(app, "POST", "/api/refresh-token", {
      cookies: "ref_app_sid=nonexistent-session",
    });
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Session expired" });
  });

  it("should return a new access_token on successful refresh", async () => {
    const sessionId = "test-session-id";
    sessions.set(sessionId, {
      refreshToken: "stored-rt",
      idToken: null,
      csrfToken: "test-csrf-token",
      createdAt: Date.now(),
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          access_token: "new-access-token",
          expires_in: 7200,
        }),
      ),
    );

    const response = await request(app, "POST", "/api/refresh-token", {
      cookies: `ref_app_sid=${sessionId}`,
      headers: { "X-CSRF-Token": "test-csrf-token" },
    });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      access_token: "new-access-token",
      expires_in: 7200,
    });
  });

  it("should return 403 when the CSRF token header is missing", async () => {
    const sessionId = "test-session-id";
    sessions.set(sessionId, {
      refreshToken: "stored-rt",
      idToken: null,
      csrfToken: "test-csrf-token",
      createdAt: Date.now(),
    });

    const response = await request(app, "POST", "/api/refresh-token", {
      cookies: `ref_app_sid=${sessionId}`,
    });
    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: "Invalid CSRF token", code: "INVALID_CSRF_TOKEN" });
  });

  it("should return 403 when the CSRF token does not match the session", async () => {
    const sessionId = "test-session-id";
    sessions.set(sessionId, {
      refreshToken: "stored-rt",
      idToken: null,
      csrfToken: "test-csrf-token",
      createdAt: Date.now(),
    });

    const response = await request(app, "POST", "/api/refresh-token", {
      cookies: `ref_app_sid=${sessionId}`,
      headers: { "X-CSRF-Token": "wrong-token" },
    });
    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: "Invalid CSRF token", code: "INVALID_CSRF_TOKEN" });
  });

  it("should update session when OAuth server rotates the refresh token", async () => {
    const sessionId = "test-session-id";
    sessions.set(sessionId, {
      refreshToken: "old-rt",
      idToken: null,
      csrfToken: "test-csrf-token",
      createdAt: Date.now(),
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          access_token: "at",
          expires_in: 3600,
          refresh_token: "rotated-rt",
        }),
      ),
    );

    await request(app, "POST", "/api/refresh-token", {
      cookies: `ref_app_sid=${sessionId}`,
      headers: { "X-CSRF-Token": "test-csrf-token" },
    });

    const session = sessions.get(sessionId);
    expect(session?.refreshToken).toBe("rotated-rt");
  });

  it("should delete session and clear cookie when OAuth server rejects refresh", async () => {
    const sessionId = "test-session-id";
    sessions.set(sessionId, {
      refreshToken: "expired-rt",
      idToken: null,
      csrfToken: "test-csrf-token",
      createdAt: Date.now(),
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("invalid_grant", { status: 400 })),
    );

    const response = await request(app, "POST", "/api/refresh-token", {
      cookies: `ref_app_sid=${sessionId}`,
      headers: { "X-CSRF-Token": "test-csrf-token" },
    });
    expect(response.status).toBe(401);
    expect(sessions.has(sessionId)).toBe(false);
  });
});

// ── /api/csrf-token — issuance ───────────────────────────────────────────────
describe("GET /api/csrf-token", () => {
  it("should return 401 when no session cookie is present", async () => {
    const response = await request(app, "GET", "/api/csrf-token");
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Not authenticated" });
  });

  it("should return 401 when session ID does not exist in the store", async () => {
    const response = await request(app, "GET", "/api/csrf-token", {
      cookies: "ref_app_sid=nonexistent-session",
    });
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Not authenticated" });
  });

  it("should return the session's CSRF token", async () => {
    const sessionId = "test-session-id";
    sessions.set(sessionId, {
      refreshToken: "rt",
      idToken: null,
      csrfToken: "session-csrf-token",
      createdAt: Date.now(),
    });

    const response = await request(app, "GET", "/api/csrf-token", {
      cookies: `ref_app_sid=${sessionId}`,
    });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ csrf_token: "session-csrf-token" });
  });
});

// ── /auth/logout — session destruction ──────────────────────────────────────
describe("POST /auth/logout", () => {
  it("should clear the cookie and succeed when no session exists", async () => {
    const response = await request(app, "POST", "/auth/logout");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "logged_out" });
  });

  it("should return 403 when the CSRF token header is missing for an active session", async () => {
    const sessionId = "test-session-id";
    sessions.set(sessionId, {
      refreshToken: "rt",
      idToken: null,
      csrfToken: "session-csrf-token",
      createdAt: Date.now(),
    });

    const response = await request(app, "POST", "/auth/logout", {
      cookies: `ref_app_sid=${sessionId}`,
    });
    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: "Invalid CSRF token", code: "INVALID_CSRF_TOKEN" });
    expect(sessions.has(sessionId)).toBe(true);
  });

  it("should destroy the session with a valid CSRF token", async () => {
    const sessionId = "test-session-id";
    sessions.set(sessionId, {
      refreshToken: "rt",
      idToken: null,
      csrfToken: "session-csrf-token",
      createdAt: Date.now(),
    });

    const response = await request(app, "POST", "/auth/logout", {
      cookies: `ref_app_sid=${sessionId}`,
      headers: { "X-CSRF-Token": "session-csrf-token" },
    });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "logged_out" });
    expect(sessions.has(sessionId)).toBe(false);
  });
});

// ── /api/session-info — JWT decoding ────────────────────────────────────────
describe("GET /api/session-info", () => {
  it("should return 401 when no session cookie is present", async () => {
    const response = await request(app, "GET", "/api/session-info");
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Not authenticated" });
  });

  it("should return 404 when session has no ID token", async () => {
    const sessionId = "test-session-id";
    sessions.set(sessionId, {
      refreshToken: "rt",
      idToken: null,
      csrfToken: "test-csrf-token",
      createdAt: Date.now(),
    });

    const response = await request(app, "GET", "/api/session-info", {
      cookies: `ref_app_sid=${sessionId}`,
    });
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "No ID token available" });
  });

  it("should decode and return ID token claims", async () => {
    const sessionId = "test-session-id";
    const idToken = buildJwt({
      sub: "user-123",
      email: "user@example.com",
      name: "Test User",
      picture: "https://example.com/pic.jpg",
      "axis:organization": "org-456",
    });
    sessions.set(sessionId, {
      refreshToken: "rt",
      idToken,
      csrfToken: "test-csrf-token",
      createdAt: Date.now(),
    });

    const response = await request(app, "GET", "/api/session-info", {
      cookies: `ref_app_sid=${sessionId}`,
    });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      sub: "user-123",
      email: "user@example.com",
      name: "Test User",
      picture: "https://example.com/pic.jpg",
      "axis:organization": "org-456",
    });
  });

  it("should return null for missing claims", async () => {
    const sessionId = "test-session-id";
    const idToken = buildJwt({ sub: "user-123" });
    sessions.set(sessionId, {
      refreshToken: "rt",
      idToken,
      csrfToken: "test-csrf-token",
      createdAt: Date.now(),
    });

    const response = await request(app, "GET", "/api/session-info", {
      cookies: `ref_app_sid=${sessionId}`,
    });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      sub: "user-123",
      email: null,
      name: null,
      picture: null,
      "axis:organization": null,
    });
  });

  it("should return 500 for a malformed ID token without payload segment", async () => {
    const sessionId = "test-session-id";
    sessions.set(sessionId, {
      refreshToken: "rt",
      idToken: "no-dots-here",
      csrfToken: "test-csrf-token",
      createdAt: Date.now(),
    });

    const response = await request(app, "GET", "/api/session-info", {
      cookies: `ref_app_sid=${sessionId}`,
    });
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Malformed ID token" });
  });
});

// ── PKCE + client authentication ────────────────────────────────────────────
describe("PKCE and client authentication", () => {
  it("should include an S256 code challenge on the login redirect", async () => {
    const { location } = await startLogin(app);
    expect(location.searchParams.get("code_challenge")).not.toBeNull();
    expect(location.searchParams.get("code_challenge_method")).toBe("S256");
  });

  it("should send Basic auth and code_verifier on token exchange", async () => {
    const { state, stateCookie } = await startLogin(app);

    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        Response.json({ access_token: "at", expires_in: 3600, refresh_token: "rt" }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await request(app, "GET", `/callback?code=auth-code&state=${state}`, {
      cookies: stateCookie,
    });

    const requestInit = fetchMock.mock.calls[0][1];
    expect(requestInit.headers.Authorization).toMatch(/^Basic /);
    expect(requestInit.body).not.toContain("client_id=");
    expect(requestInit.body).toContain("code_verifier=");
  });

  it("should send Basic auth on token refresh", async () => {
    const sessionId = "test-session-id";
    sessions.set(sessionId, {
      refreshToken: "stored-rt",
      idToken: null,
      csrfToken: "test-csrf-token",
      createdAt: Date.now(),
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValue(Response.json({ access_token: "new-at", expires_in: 3600 }));
    vi.stubGlobal("fetch", fetchMock);

    await request(app, "POST", "/api/refresh-token", {
      cookies: `ref_app_sid=${sessionId}`,
      headers: { "X-CSRF-Token": "test-csrf-token" },
    });

    const requestInit = fetchMock.mock.calls[0][1];
    expect(requestInit.headers.Authorization).toMatch(/^Basic /);
    expect(requestInit.body).not.toContain("client_id=");
  });
});

// ── Hardening ───────────────────────────────────────────────────────────────────────────
describe("rate limiting", () => {
  it("should allow frequent session requests from a long-lived tab", async () => {
    sessions.set("test-session-id", {
      refreshToken: "rt",
      idToken: null,
      csrfToken: "test-csrf-token",
      createdAt: Date.now(),
    });

    for (let index = 0; index < 50; index++) {
      const response = await request(app, "GET", "/api/csrf-token", {
        cookies: "ref_app_sid=test-session-id",
      });
      expect(response.status).toBe(200);
    }
  });

  it("should still limit login attempts", async () => {
    for (let index = 0; index < 30; index++) {
      await request(app, "GET", "/auth/login");
    }
    const response = await request(app, "GET", "/auth/login");
    expect(response.status).toBe(429);
  });
});

describe("concurrent refresh", () => {
  it("should call the token endpoint once for parallel refreshes of the same session", async () => {
    sessions.set("test-session-id", {
      refreshToken: "rt",
      idToken: null,
      csrfToken: "test-csrf-token",
      createdAt: Date.now(),
    });

    const fetchMock = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(Response.json({ access_token: "at", expires_in: 60 })), 50);
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const refresh = () =>
      request(app, "POST", "/api/refresh-token", {
        cookies: "ref_app_sid=test-session-id",
        headers: { "X-CSRF-Token": "test-csrf-token" },
      });
    const [first, second] = await Promise.all([refresh(), refresh()]);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("token response validation", () => {
  it("should not create a session when the token response has no refresh_token", async () => {
    const { state, stateCookie } = await startLogin(app);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ access_token: "at", expires_in: 3600 })),
    );

    const response = await request(app, "GET", `/callback?code=auth-code&state=${state}`, {
      cookies: stateCookie,
    });
    expect(response.headers.location).toContain("/error?code=TOKEN_EXCHANGE_FAILED");
    expect(sessions.size).toBe(0);
  });

  it("should return 502 and keep the session when the refresh response is incomplete", async () => {
    sessions.set("test-session-id", {
      refreshToken: "rt",
      idToken: null,
      csrfToken: "test-csrf-token",
      createdAt: Date.now(),
    });

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ token_type: "bearer" })));

    const response = await request(app, "POST", "/api/refresh-token", {
      cookies: "ref_app_sid=test-session-id",
      headers: { "X-CSRF-Token": "test-csrf-token" },
    });
    expect(response.status).toBe(502);
    expect(response.body).toEqual({ error: "Token refresh failed", code: "REFRESH_FAILED" });
    expect(sessions.has("test-session-id")).toBe(true);
  });
});

describe("response headers", () => {
  it("should disable caching and hide the framework header", async () => {
    const response = await request(app, "GET", "/api/csrf-token");
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(response.headers["x-powered-by"]).toBeUndefined();
  });
});
