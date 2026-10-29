#!/usr/bin/env node

/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import { promises as fs, constants as fsConstants } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

async function copyEnvLocal(packageDir) {
  const exampleFile = path.join(repoRoot, packageDir, ".env.local.example");
  const targetFile = path.join(repoRoot, packageDir, ".env.local");

  try {
    await fs.access(exampleFile);
  } catch {
    throw new Error(`Missing template: ${exampleFile}`);
  }

  try {
    await fs.copyFile(exampleFile, targetFile, fsConstants.COPYFILE_EXCL);
    process.stdout.write(`Created: ${targetFile} (copied from .env.local.example)\n`);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "EEXIST") {
      process.stdout.write(`OK: ${targetFile} already exists (leaving as-is)\n`);
      return;
    }

    throw error;
  }
}

async function main() {
  await copyEnvLocal("packages/frontend");
  await copyEnvLocal("packages/backend");
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`ERROR: ${message}\n`);
  process.exit(1);
});
