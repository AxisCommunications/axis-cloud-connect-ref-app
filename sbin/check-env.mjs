#!/usr/bin/env node

/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import { readFileSync } from "node:fs";

const hasValue = (content, key) => {
  const match = content.match(new RegExp(`^${key}=(.*)$`, "m"));
  if (match === null) {
    return false;
  }
  // Treat quoted empty values ("" or '') as missing.
  const value = match[1].trim().replace(/^(["'])(.*)\1$/, "$2");
  return value !== "";
};

const check = (file, keys) => {
  let content;
  try {
    content = readFileSync(file, "utf-8");
  } catch {
    return keys.map((key) => `${file}: ${key}`);
  }
  return keys.filter((key) => !hasValue(content, key)).map((key) => `${file}: ${key}`);
};

const missing = [
  ...check("packages/backend/.env.local", ["OAUTH2_CLIENT_ID", "OAUTH2_CLIENT_SECRET"]),
  ...check("packages/frontend/.env.local", [
    "VITE_ACC_BASE_URL",
    "VITE_EDGELINK_BASE_URL",
    "VITE_VIDEO_SIGNALING_URL",
    "VITE_ADA_BASE_URL",
  ]),
];

if (missing.length > 0) {
  const portalHint = missing.some((entry) => entry.includes("OAUTH2_CLIENT_"))
    ? "Get an OAuth 2.0 client ID and secret at https://portal.connect.developer.axis.com/\n"
    : "";
  process.stderr.write(
    `\nMissing environment values:\n  ${missing.join("\n  ")}\n` +
      "Run 'npm run setup-environment', then fill in the missing values.\n" +
      `${portalHint}\n`,
  );
  process.exit(1);
}
