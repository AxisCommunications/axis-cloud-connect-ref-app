/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { context } from "esbuild";

const argOptions = {
  serve: {
    type: "boolean",
    short: "s",
  },
};

const args = parseArgs({ args: process.argv.slice(2), options: argOptions });
const serve = args.values.serve ?? false;

const __dir = path.dirname(fileURLToPath(import.meta.url));

const outdir = path.join(__dir, "dist");
fs.rmSync(path.join(outdir), {
  recursive: true,
  force: true,
});

// Copy static assets that are loaded at runtime
fs.mkdirSync(outdir, { recursive: true });

let serverProcess;
function restartServer() {
  if (serverProcess) {
    serverProcess.kill();
  }

  serverProcess = spawn("node", [path.join(__dir, "dist/server.js")], {
    stdio: "inherit",
  });
}

const reloadPlugin = {
  name: "reload",
  setup(build) {
    build.onEnd(() => {
      console.log("Build finished, restarting server...");
      restartServer();
    });
  },
};

let config = {
  entryPoints: [path.join(__dir, "src/server.ts")],
  bundle: true,
  platform: "node",
  outdir,
  packages: "external",
  format: "esm",
};

if (serve) {
  config = { ...config, plugins: [reloadPlugin] };
}

const ctx = await context(config);
await ctx.rebuild();

if (serve) {
  await ctx.watch();
} else {
  console.log("\x1b[32m%s\x1b[0m", `Build complete: see ${outdir}`);
  await ctx.dispose();
}

const end = async (signal) => {
  if (serverProcess) {
    serverProcess.kill(signal);
  }
  await ctx.dispose();
  process.exit(0);
};

process.on("SIGTERM", () => {
  end("SIGTERM");
});

process.on("SIGINT", () => {
  end("SIGINT");
});
