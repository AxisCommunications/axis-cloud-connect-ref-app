/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import { describe, expect, it } from "vitest";

import { generateCurlCommand } from "./curlGenerator";

describe("generateCurlCommand", () => {
  it("quotes the URL, headers and body so single quotes cannot break out", () => {
    const command = generateCurlCommand({
      url: "https://edge.example.com/vapix/x.cgi?a=';touch /tmp/pwned;'",
      method: "POST",
      headers: { "X-Test": "it's" },
      body: "don't",
    });

    expect(command).toContain(
      `'https://edge.example.com/vapix/x.cgi?a='\\'';touch /tmp/pwned;'\\'''`,
    );
    expect(command).toContain(`-H 'X-Test: it'\\''s'`);
    expect(command).toContain(`-d 'don'\\''t'`);
  });
});
