/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import fc from "fast-check";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// tokens.ts uses module-level variables (accessToken, expiresAt, csrfToken, refreshPromise).
// We reset the module between tests so each test starts with clean state.

const jsonResponse = (body: unknown, init?: ResponseInit): Promise<Response> =>
  Promise.resolve(Response.json(body, init));

/** Mock fetch so `/api/csrf-token` resolves immediately, other URLs use `handleOtherRequest`. */
const mockFetchWithCsrfToken = (
  handleOtherRequest: (url: string) => Promise<Response>,
  csrfToken = "csrf-token",
) => {
  vi.mocked(fetch).mockImplementation((input) => {
    const url = String(input);
    if (url.includes("/api/csrf-token")) {
      return jsonResponse({ csrf_token: csrfToken });
    }
    return handleOtherRequest(url);
  });
};

describe("getToken", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return cached token when it has not expired", async () => {
    mockFetchWithCsrfToken(() => jsonResponse({ access_token: "fresh-token", expires_in: 3600 }));

    const { getToken } = await import("./tokens");

    // First call — triggers refresh (no token in memory yet)
    const token1 = await getToken();
    // Second call — should return from cache
    const token2 = await getToken();

    expect(token1).toBe("fresh-token");
    expect(token2).toBe("fresh-token");
    // One CSRF-token fetch, one refresh-token fetch — cached afterwards
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("captures generated OAuth token payloads from URL fragments", async () => {
    const { captureTokensFromCallback, isAuthenticated } = await import("./tokens");

    fc.assert(
      fc.property(
        fc.record({
          access_token: fc.string({ minLength: 1, maxLength: 256 }),
          expires_in: fc.integer({ min: 60, max: 3600 }),
        }),
        (tokens) => {
          const encodedTokens = encodeURIComponent(JSON.stringify(tokens));
          window.history.replaceState(
            null,
            "",
            `${window.location.pathname}${window.location.search}#tokens=${encodedTokens}`,
          );

          expect(captureTokensFromCallback()).toBe(true);
          expect(isAuthenticated()).toBe(true);
          expect(window.location.hash).toBe("");
        },
      ),
    );
  });

  it("rejects generated malformed OAuth token fragments", async () => {
    const { captureTokensFromCallback, isAuthenticated } = await import("./tokens");

    fc.assert(
      fc.property(fc.string({ maxLength: 256 }), (invalidJson) => {
        const encodedTokens = encodeURIComponent(`${invalidJson}\u0000`);
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}${window.location.search}#tokens=${encodedTokens}`,
        );

        expect(captureTokensFromCallback()).toBe(false);
        expect(isAuthenticated()).toBe(false);
        expect(window.location.hash).not.toBe("");
      }),
    );
  });

  it("should send the CSRF token header when refreshing", async () => {
    mockFetchWithCsrfToken(
      () => jsonResponse({ access_token: "fresh-token", expires_in: 3600 }),
      "session-csrf-token",
    );

    const { getToken } = await import("./tokens");
    await getToken();

    const refreshCall = vi
      .mocked(fetch)
      .mock.calls.find(([url]) => String(url).includes("/api/refresh-token"));
    expect(refreshCall?.[1]?.headers).toEqual({ "X-CSRF-Token": "session-csrf-token" });
  });

  it("should refresh when the cached token has expired", async () => {
    mockFetchWithCsrfToken(() => jsonResponse({ access_token: "first-token", expires_in: 60 }));

    const { getToken } = await import("./tokens");

    await getToken();
    expect(fetch).toHaveBeenCalledTimes(2);

    // Advance time past expiry (60s token - 10s buffer = 50s effective)
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 51_000);

    mockFetchWithCsrfToken(() =>
      jsonResponse({ access_token: "refreshed-token", expires_in: 3600 }),
    );

    const token = await getToken();
    expect(token).toBe("refreshed-token");
    // CSRF token is cached from the first refresh — only one more fetch call
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("should deduplicate concurrent refresh calls into a single fetch", async () => {
    let resolveFetch: ((value: Response) => void) | undefined;
    const deferred = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    mockFetchWithCsrfToken(() => deferred);

    const { getToken } = await import("./tokens");

    const promise1 = getToken();
    const promise2 = getToken();

    resolveFetch?.(Response.json({ access_token: "dedup-token", expires_in: 3600 }));

    const [token1, token2] = await Promise.all([promise1, promise2]);

    expect(token1).toBe("dedup-token");
    expect(token2).toBe("dedup-token");
    // One CSRF-token fetch, one refresh-token fetch
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("should clear tokens and throw when refresh fails", async () => {
    mockFetchWithCsrfToken(() => Promise.resolve(new Response(null, { status: 401 })));

    const { getToken, isAuthenticated } = await import("./tokens");

    await expect(getToken()).rejects.toThrow("Token refresh failed");
    expect(isAuthenticated()).toBe(false);
  });

  it("should allow a new refresh after a failed one", async () => {
    // First call fails
    mockFetchWithCsrfToken(() => Promise.resolve(new Response(null, { status: 401 })));

    const { getToken } = await import("./tokens");
    await expect(getToken()).rejects.toThrow("Token refresh failed");

    // Second call succeeds — refreshPromise must have been cleared by .finally()
    mockFetchWithCsrfToken(() =>
      jsonResponse({ access_token: "recovered-token", expires_in: 3600 }),
    );

    const token = await getToken();
    expect(token).toBe("recovered-token");
  });
});

describe("logout", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends the CSRF token header when logging out", async () => {
    mockFetchWithCsrfToken(
      () => Promise.resolve(new Response(null, { status: 200 })),
      "logout-csrf-token",
    );

    const { logout } = await import("./tokens");
    await logout();

    const logoutCall = vi
      .mocked(fetch)
      .mock.calls.find(([url]) => String(url).includes("/auth/logout"));
    expect(logoutCall?.[1]?.headers).toEqual({ "X-CSRF-Token": "logout-csrf-token" });
  });
});
