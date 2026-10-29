/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import { createApp } from "./index";

// ── Startup validation ──────────────────────────────────────────────────────
const REQUIRED_ENV = [
  "OAUTH2_CLIENT_ID",
  "OAUTH2_CLIENT_SECRET",
  "OAUTH2_AUTHORIZATION_URL",
  "OAUTH2_TOKEN_URL",
  "OAUTH2_REDIRECT_URI",
  "CORS_ORIGIN",
] as const;

const missing = REQUIRED_ENV.filter((key) => (process.env[key] ?? "") === "");
if (missing.length > 0) {
  console.error(
    `FATAL: Missing required environment variables:\n  ${missing.join("\n  ")}\n` +
      "Get an OAuth 2.0 client ID and secret at https://portal.connect.developer.axis.com/",
  );
  process.exit(1);
}

// ── Start server ────────────────────────────────────────────────────────────
const PORT = process.env.PORT !== undefined ? Number.parseInt(process.env.PORT, 10) : 3000;
const { app } = createApp();
const server = app.listen(PORT);

process.on("SIGTERM", () => {
  server.close(() => process.exit(0));
});

process.on("SIGINT", () => {
  server.close(() => process.exit(0));
});
