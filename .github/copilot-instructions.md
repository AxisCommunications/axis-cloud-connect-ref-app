---
applyTo: "**"
---

# Coding Conventions — Axis Cloud Connect Reference App

These rules apply to **all** code in this monorepo.
Every AI-assisted change **must** follow them strictly.

---

## Project Structure

This is an npm-workspaces monorepo:

```txt
packages/
    backend/   — Express.js OAuth 2.0 confidential client (token exchange and refresh; PKCE on every login)
    frontend/  — React + Vite SPA (Fluent UI, WebRTC video player, direct API calls)
```

### Architecture: OAuth 2.0 Backend + Direct Frontend

- The **backend** is an OAuth 2.0 **confidential client** done in an easy to follow single file. It holds `client_secret` and manages **server-side sessions** with HttpOnly cookies. It handles authorization code exchange, token refresh (using stored refresh tokens), session info (decoded ID token claims), and logout. Every login uses **PKCE** (`S256`, `packages/backend/src/pkce.ts`) together with client authentication, and the OAuth `state` is bound to the browser via a short-lived HttpOnly cookie. `OAUTH2_CLIENT_ID` and `OAUTH2_CLIENT_SECRET` are required; developers get them by registering an OAuth 2.0 client in the [Axis Developer Portal](https://portal.connect.developer.axis.com/).
- The **frontend receives only the `access_token`** via URL fragment after OAuth 2.0 callback and stores it **in memory** (module-level variable). Refresh tokens and ID tokens are **never exposed to the browser** — they are stored server-side. The frontend makes **direct calls** to external Axis APIs (ACC REST API, EdgeLink VAPIX, WebRTC signaling) using Bearer tokens.
- Session persistence across page reloads uses the HttpOnly session cookie — the frontend calls `POST /api/refresh-token` (cookie sent automatically) to obtain a fresh `access_token`.
- The backend exists because the OAuth 2.0 flow uses a `client_secret` (confidential client) and to keep sensitive tokens (refresh, ID) server-side. PKCE is used on every login in addition to the secret.

---

## TypeScript

- **Strict mode** everywhere (`"strict": true` in `tsconfig.json`).
- **No `any`**. Use `unknown` and narrow with type guards when the type is truly unknown.
- **Use `type` imports** for type-only imports: `import type { Foo } from "./foo"`.
- **Descriptive names**: no single-letter variables (except loop indices), no abbreviations. `organizationArn` not `orgArn`, `accessToken` not `at`.
- **Functions**: single responsibility, aim for ≤50 lines. If a function does two things, split it.
- **Export only what is needed**. Prefer named exports over default exports.

### Control Flow

- **Always use braces** around `return`, `break`, `continue`, and `throw` in control flow. No braceless single-line statements.

```ts
// ✅ Correct
if (!tokens) {
    return;
}

// ❌ Wrong
if (!tokens) return;
```

### Explicit Conditions

- **No falsy checks** for non-boolean values. Always compare explicitly against `undefined`, `null`, `""`, or `.length === 0`. This applies to `if`, ternaries, `&&`, and `||`.
- **Exception**: boolean variables and expressions may use implicit checks (e.g., `if (isLoading)`, `if (!isConnected)`).

```ts
// ✅ Correct
if (value === undefined) { … }
if (array.length === 0) { … }
if (name === "") { … }
if (ref.current !== null) { … }
const label = title !== undefined ? title : "default";
if (isLoading) { … }           // boolean — implicit OK
if (!isConnected) { … }        // boolean — implicit OK

// ❌ Wrong
if (!value) { … }              // ambiguous — could be null, undefined, 0, or ""
if (!array.length) { … }
if (ref.current) { … }         // ref is T | null — compare explicitly
const label = title || "default";
```

### Function Style

- **Frontend**: use arrow functions everywhere (components, hooks, helpers, callbacks). Use `function` only when technically required (e.g., generators).
- **Backend**: use arrow functions for inline Express route handlers and small callbacks. Use `function` keyword for extracted/named handler functions and utility exports.

---

## Import Order

Group and order imports in every file:

```ts
// 1. Node.js built-ins
import { randomBytes, type BinaryLike } from "node:crypto";

// 2. External dependencies
import express, { type Request, type Response } from "express";
import { jwtDecode, type JwtPayload } from "jwt-decode";

// 3. Local application modules
import { getToken } from "../auth";
import { type DeviceInfo } from "../types";
```

**Never** place imports partway through a file. All imports go at the top.

---

## Backend (Express)

### Architecture

The backend is a **single-file Express server** (`packages/backend/src/index.ts`). Intentionally minimal.

It provides exactly these endpoints:

| Endpoint | Method | Purpose |
| -------- | ------ | ------- |
| `/health` | GET | Health check |
| `/auth/login` | GET | Initiates OAuth 2.0 flow (generates CSRF state and PKCE pair, sets browser-bound state cookie, redirects to authorization server) |
| `/callback` | GET | OAuth 2.0 callback (validates state against the state cookie, exchanges code with `code_verifier` for tokens, stores refresh/ID tokens server-side, sets HttpOnly session cookie, redirects to frontend with only `access_token` in URL fragment) |
| `/api/refresh-token` | POST | Token refresh (identifies session via cookie, requires `X-CSRF-Token` header, uses stored refresh token, returns only `access_token` and `expires_in`) |
| `/api/session-info` | GET | Returns decoded ID token claims (sub, email, name, picture, axis:organization) from server-side session |
| `/api/csrf-token` | GET | Returns the session-bound CSRF token required by other state-changing endpoints |
| `/auth/logout` | POST | Clears server-side session and cookie (requires `X-CSRF-Token` header) |

### Key Design Decisions

- **HttpOnly session cookies** — the backend uses `cookie-parser` and sets an HttpOnly Secure cookie (`ref_app_sid`) containing a random session ID. Refresh tokens and ID tokens are stored in an in-memory `Map` keyed by session ID.
- **In-memory session store** with automatic cleanup (24-hour TTL from login; refreshing does not extend it). Same pattern as the CSRF state store. Sessions do not survive backend restarts. Each session carries its own random CSRF token (`packages/backend/src/csrf.ts`), issued via `/api/csrf-token` and required as the `X-CSRF-Token` header on `/api/refresh-token` and `/auth/logout`.
- **In-memory CSRF state store** with automatic cleanup (10-minute TTL). Each entry holds the login's PKCE `code_verifier`, and the `state` is also set in an HttpOnly `ref_app_oauth_state` cookie (`SameSite=Lax`) that `/callback` must match.
- **Token handoff via URL fragment**: after code exchange, the backend redirects to `frontend/#tokens={encoded-json}` containing **only** `access_token` and `expires_in`. No `refresh_token` or `id_token` in the fragment.
- **Environment validation** at startup — fails fast if required variables are missing.
- **Session cookie configuration**: `HttpOnly`, `Secure` (in production), `SameSite=Lax`, `Path=/`, 24h max-age. The `ref_app_oauth_state` cookie uses the same attributes but is always `SameSite=Lax` with a 10-minute max-age, and is cleared only after a matching callback.

### Error Handling

- Every error response follows the shape: `{ error: string, code?: string }`.
- Never expose stack traces or internal details in production error responses.

### Logging

- **No `console.log`**, **`console.info`**, or **`console.debug`** in production code.
- Use `console.error` only for truly exceptional situations (unhandled errors, startup failures).
- Use `console.warn` only for degraded-but-recoverable situations (missing optional config).
- **Never log secrets**: no `client_secret`, `access_token`, `refresh_token`, or token response data.
- Never override `console` methods globally.

### Security

- No hardcoded secrets or fallback defaults for sensitive values. `OAUTH2_CLIENT_ID` and `OAUTH2_CLIENT_SECRET` have no committed defaults and are required at startup. `OAUTH2_CLIENT_SECRET` must never be logged or exposed.
- Rate-limit authentication endpoints. Login/callback use a strict limit; session endpoints (`/api/*`, `/auth/logout`) use a higher one because short-lived access tokens make each tab refresh about once a minute.
- Serialize token refreshes per session so parallel tabs never reuse a rotated refresh token.
- Validate token endpoint responses before creating or updating a session. Log only the HTTP status and OAuth `error` code, never the response body.
- Send `Cache-Control: no-store` on all backend responses.
- Validate `state` parameter on OAuth callbacks to prevent CSRF, and require it to match the browser's `ref_app_oauth_state` cookie.
- Use PKCE (`S256`) on every authorization request, in addition to client authentication.
- Require a session-bound `X-CSRF-Token` header (synchronizer token pattern) on state-changing, cookie-authenticated endpoints (`/api/refresh-token`, `/auth/logout`).
- CORS configured to allow only the frontend origin.
- **Refresh tokens and ID tokens are never sent to the frontend** — stored server-side, identified by HttpOnly session cookie.
- Session cookies use `HttpOnly`, `Secure`, `SameSite`, and `Path=/` attributes.

---

## Frontend (React + Vite)

### Component Guidelines

- **Functional components only** with hooks.
- **Single responsibility**: one component = one visual/behavioral concern.
- **Readonly props**: all component prop types must use `readonly` on every property.
- Colocate component, styles, and types in the same feature folder when possible.

### `useEffect` Rules

Only use `useEffect` when synchronizing with an **external system** (DOM APIs, WebSocket subscriptions, browser events, third-party libraries). Specifically:

- **DO NOT** use `useEffect` to derive state from other state or props — compute it during render or use `useMemo`.
- **DO NOT** use `useEffect` to respond to user events — use event handlers.
- **DO NOT** chain `useEffect` calls that set state to trigger other effects — restructure into a single data flow.
- **DO** use `useEffect` for: fetching data on mount, subscribing to WebSocket/events, setting up timers, integrating with non-React code.

### State Management

- Derive values during render whenever possible instead of storing them in state.
- Minimize the number of `useState` calls — if two pieces of state always change together, combine them.
- Keep state as close to where it's used as possible.

### Styling

- **No inline styles**. Use `makeStyles` from `@fluentui/react-components` (Griffel) to define all styles.
- Define a `useStyles` hook via `makeStyles()` at the top of each component file and apply classes with `className={styles.xxx}`.
- For conditional styles, use `mergeClasses` from `@fluentui/react-components` to combine class names.
- Inline `style` props are acceptable **only** when the value is truly dynamic at runtime (e.g., a CSS property driven by a data variable or user input that cannot be known at build time). Add a brief comment explaining why.

### Auth

- The frontend **stores only the `access_token` in memory** via `packages/frontend/src/auth/tokens.ts`. The token is captured from the URL fragment after OAuth 2.0 callback.
- **Refresh tokens and ID tokens are stored server-side** — the frontend never sees them. An HttpOnly session cookie identifies the session.
- On page reload, `restoreSession()` calls `POST /api/refresh-token` with `credentials: "include"` — the cookie is sent automatically and the backend returns a fresh `access_token`.
- `getToken()` handles automatic refresh with deduplication — concurrent calls return the same promise to prevent multiple refresh requests.
- `login()` redirects the browser to the backend's `/auth/login` endpoint.
- `logout()` calls `POST /auth/logout` to clear the server-side session and cookie, then redirects to `/`.
- Use the `AuthContext` to check if the user is authenticated (via `isAuthenticated()` from `tokens.ts`).
- User info (organization, email, etc.) is fetched from `GET /api/session-info` (decoded ID token claims from the backend).

### API Calls

- The frontend calls external Axis APIs **directly** with Bearer tokens — there is no backend proxy.
- **ACC REST API**: called via `VITE_ACC_BASE_URL/organizations/...` (e.g. `/organizations`, `/organizations/{orgId}/devices`, `/organizations/{orgId}/resource-groups`) with an `Authorization: Bearer {token}` header. List endpoints are cursor-paginated (`pageSize` + `cursor`). Devices are fetched per resource group on demand with the `resourceGroupId` filter (direct members only).
- **EdgeLink VAPIX**: called via `VITE_EDGELINK_BASE_URL/organizations/{org}/targets/{target}/{cgi}` with `Authorization: Bearer {token}`.
- **WebRTC signaling**: connected via WebSocket to `VITE_VIDEO_SIGNALING_URL` with the access token.
- **Token refresh**: the frontend calls `POST /api/refresh-token` with `credentials: "include"` (no body) — the backend identifies the session via the HttpOnly cookie and returns `{ access_token, expires_in }`.
- **User info**: the frontend calls `GET /api/session-info` with `credentials: "include"` to get decoded ID token claims from the backend.

---

## License Header

Every source file (`.ts`, `.tsx`, `.js`, `.mjs`, `.css`, `.html`) **must** begin with the Axis copyright header. Add it as the very first content in the file, before any imports or code.

For `.ts`, `.tsx`, `.js`, `.mjs`, and `.css` files:

```ts
/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

```

For `.html` files:

```html
<!--
    Copyright (C) 2026 Axis Communications AB, Lund, Sweden

    Use of this source code is governed by an MIT-style
    license that can be found in the LICENSE file or at
    https://opensource.org/licenses/MIT.
-->
```

---

## Code Quality

- **DRY**: If the same logic exists in two places, extract it to a local utility.
- **No commented-out code**. Delete it; Git remembers.
- **No `TODO` or `FIXME` without a linked issue number**.
- **Consistent error response shape** across all backend endpoints.
- Run `npm run lint` before committing. The CI will reject PRs that fail lint.

---

## Documentation Sync

Before considering any coding task done, run the `docs-sync` skill if the change touches
backend endpoints, env vars, npm scripts, frontend features, domain terms/acronyms,
packages, or architecture/auth flows. Do not report a task complete without doing this check.
