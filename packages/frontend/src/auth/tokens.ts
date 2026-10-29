/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

/**
 * Minimal token management — stores only the access_token in memory.
 * Refresh tokens are stored server-side; the backend identifies sessions
 * via an HttpOnly cookie set during the OAuth2 callback.
 */

const REFRESH_BUFFER_MS = 10000;
const BACKEND_URL = import.meta.env.VITE_API_BASE_URL ?? "";

let accessToken: string | null = null;
let expiresAt: number | null = null;
let csrfToken: string | null = null;

interface TokenPayload {
  access_token: string;
  expires_in?: number;
}

/**
 * Get the session-bound CSRF token, fetching it from the backend if not
 * already cached. Required to call state-changing endpoints (refresh, logout).
 */
const ensureCsrfToken = async (): Promise<string> => {
  if (csrfToken !== null) {
    return csrfToken;
  }

  const response = await fetch(`${BACKEND_URL}/api/csrf-token`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to obtain CSRF token");
  }

  const data: { csrf_token: string } = await response.json();
  csrfToken = data.csrf_token;
  return csrfToken;
};

const storeTokens = (tokens: TokenPayload) => {
  accessToken = tokens.access_token;
  expiresAt = tokens.expires_in !== undefined ? Date.now() + tokens.expires_in * 1000 : null;
};

/**
 * Check URL fragment for tokens delivered by the OAuth2 callback.
 * Call once on app startup. Returns true if tokens were captured.
 */
export const captureTokensFromCallback = (): boolean => {
  const hash = window.location.hash;
  const match = hash.match(/tokens=(.+)/);
  if (match === null) {
    return false;
  }

  try {
    const tokens: TokenPayload = JSON.parse(decodeURIComponent(match[1]));
    storeTokens(tokens);
  } catch {
    return false;
  }

  // Clean the URL fragment
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
  return true;
};

const isExpired = (): boolean => {
  if (expiresAt === null) {
    return false;
  }
  return Date.now() >= expiresAt - REFRESH_BUFFER_MS;
};

// Deduplication for concurrent refresh calls
let refreshPromise: Promise<string> | null = null;

/**
 * Get a valid access token, refreshing automatically if expired.
 * The backend identifies the session via the HttpOnly cookie.
 * Throws if no session exists (user must log in).
 */
export const getToken = async (): Promise<string> => {
  if (accessToken !== null && !isExpired()) {
    return accessToken;
  }

  if (refreshPromise !== null) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    let token: string;
    try {
      token = await ensureCsrfToken();
    } catch {
      clearTokens();
      throw new Error("Token refresh failed");
    }

    const response = await fetch(`${BACKEND_URL}/api/refresh-token`, {
      method: "POST",
      credentials: "include",
      headers: { "X-CSRF-Token": token },
    });

    if (!response.ok) {
      clearTokens();
      throw new Error("Token refresh failed");
    }

    const tokens: TokenPayload = await response.json();
    storeTokens(tokens);
    return accessToken as string;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
};

const clearTokens = () => {
  accessToken = null;
  expiresAt = null;
  csrfToken = null;
};

export const isAuthenticated = (): boolean => accessToken !== null;

export const login = () => {
  window.location.href = `${BACKEND_URL}/auth/login`;
};

export const logout = async () => {
  try {
    const token = await ensureCsrfToken();
    await fetch(`${BACKEND_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: { "X-CSRF-Token": token },
    });
  } catch {
    // Best-effort — clear local state regardless
  }
  clearTokens();
  window.location.href = "/";
};

/**
 * Attempt to restore a session using the HttpOnly session cookie.
 * If the cookie is present and valid, the backend returns a fresh access_token.
 *
 * @returns `true` if the session was successfully restored.
 */
export const restoreSession = async (): Promise<boolean> => {
  if (accessToken !== null) {
    return true;
  }

  try {
    await getToken();
    return true;
  } catch {
    clearTokens();
    return false;
  }
};
