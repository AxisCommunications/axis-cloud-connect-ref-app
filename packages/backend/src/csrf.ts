/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import { randomBytes, timingSafeEqual } from "node:crypto";

/** Generate a new random per-session CSRF token. */
export function generateCsrfToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Compare the caller-supplied CSRF token against the one stored in their
 * server-side session, using a constant-time comparison.
 */
export function isValidCsrfToken(
  expectedToken: string,
  suppliedToken: string | undefined,
): boolean {
  if (suppliedToken === undefined) {
    return false;
  }

  const expectedBuffer = Buffer.from(expectedToken);
  const suppliedBuffer = Buffer.from(suppliedToken);

  return (
    expectedBuffer.length === suppliedBuffer.length &&
    timingSafeEqual(expectedBuffer, suppliedBuffer)
  );
}
