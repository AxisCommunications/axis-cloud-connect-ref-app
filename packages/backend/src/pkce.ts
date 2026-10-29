/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

/**
 * PKCE (Proof Key for Code Exchange, RFC 7636).
 *
 * Used on every login, together with the client secret, to bind the
 * authorization code to the login request that asked for it, preventing
 * authorization code injection.
 */

import { createHash, randomBytes } from "node:crypto";

export interface PkcePair {
  codeVerifier: string;
  codeChallenge: string;
}

/** Generate a one-time code verifier and its S256 code challenge. */
export function generatePkcePair(): PkcePair {
  const codeVerifier = randomBytes(32).toString("base64url");
  const codeChallenge = createHash("sha256").update(codeVerifier).digest("base64url");
  return { codeVerifier, codeChallenge };
}
