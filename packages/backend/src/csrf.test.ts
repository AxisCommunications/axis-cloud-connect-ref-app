/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import { describe, expect, it } from "vitest";

import { generateCsrfToken, isValidCsrfToken } from "./csrf";

describe("generateCsrfToken", () => {
  it("creates a random 64-character hex token", () => {
    const token = generateCsrfToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("isValidCsrfToken", () => {
  it("accepts a matching token", () => {
    expect(isValidCsrfToken("expected-token", "expected-token")).toBe(true);
  });

  it("rejects an undefined supplied token", () => {
    expect(isValidCsrfToken("expected-token", undefined)).toBe(false);
  });

  it("rejects a mismatched token", () => {
    expect(isValidCsrfToken("expected-token", "different-token")).toBe(false);
  });

  it("rejects a token of different length", () => {
    expect(isValidCsrfToken("expected-token", "expected-token-longer")).toBe(false);
  });
});
