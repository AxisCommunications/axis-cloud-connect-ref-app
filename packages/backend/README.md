<!-- markdownlint-disable MD041 -->
*©2026 Axis Communications AB. AXIS COMMUNICATIONS, AXIS, ARTPEC and VAPIX are registered trademarks of Axis AB in various jurisdictions. All other trademarks are the property of their respective owners.*
<!-- markdownlint-enable MD041 -->

# Backend Package

The Node.js/Express backend server for the Axis Cloud Connect Reference App.

The backend is an OAuth 2.0 **confidential client**. It holds `client_secret`,
exchanges authorization codes for tokens, and manages server-side sessions with
HttpOnly cookies. Refresh tokens and ID tokens are stored server-side and never
exposed to the frontend.

Every login also uses PKCE and a short-lived state cookie (see
[Login security](../../DEVELOPMENT.md#login-security)). The backend requires an OAuth 2.0 client ID and
secret from the [Axis Developer Portal](https://portal.connect.developer.axis.com/).

The frontend calls external APIs (ACC REST API, EdgeLink VAPIX, WebRTC
signaling) directly with Bearer tokens — the backend does not proxy API calls.

## Architecture

The backend is intentionally minimal — the app logic lives in `src/index.ts` (exported
`createApp()` factory) and the entrypoint is `src/server.ts` (environment validation and server
startup). It uses in-memory session storage.

For the main endpoint reference and the detailed OAuth and token-refresh flows, see the
[Development Guide](../../DEVELOPMENT.md#backend-design).

## License

[MIT](../../LICENSE)
