/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import dns from "node:dns";
import { createReadStream } from "node:fs";
import { resolve } from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import wasm from "vite-plugin-wasm";

dns.setDefaultResultOrder("verbatim");

const WEBRTC_WASM_SOURCE_PATH = resolve(
  import.meta.dirname,
  "../../node_modules/@axis-communications/axis-web-video-player/node_modules/@axiscommunications/webrtcvideo/webrtcvideo_bg.wasm",
);
// The pre-bundled video player resolves its wasm relative to Vite's deps directory.
const WEBRTC_WASM_DEV_URL = "/node_modules/.vite/deps/webrtcvideo_bg.wasm";

const serveWebRtcWasm = (): Plugin => ({
  name: "serve-webrtc-wasm",
  apply: "serve",
  configureServer: (server) => {
    server.middlewares.use(WEBRTC_WASM_DEV_URL, (_request, response) => {
      response.setHeader("Content-Type", "application/wasm");
      createReadStream(WEBRTC_WASM_SOURCE_PATH).pipe(response);
    });
  },
});

// https://vitejs.dev/config/
export default defineConfig(() => {
  const plugins = [react(), wasm(), serveWebRtcWasm()];
  return {
    build: {
      // es2022 supports the top-level await emitted by vite-plugin-wasm.
      target: "es2022",
      rolldownOptions: {
        input: {
          main: resolve(import.meta.dirname, "index.html"),
          "auth-callback": resolve(import.meta.dirname, "index.html"),
          "oauth-callback": resolve(import.meta.dirname, "index.html"),
        },
        output: {
          // Long-lived vendor chunks stay cached across app releases.
          codeSplitting: {
            groups: [
              {
                name: "react-vendor",
                test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/,
              },
            ],
          },
        },
      },
      sourcemap: process.env.NODE_ENV !== "production",
    },
    plugins: plugins,
    resolve: {
      tsconfigPaths: true,
    },
    server: {
      host: "localhost",
      port: 5173,
      proxy: {
        "/api": {
          target: "http://localhost:3000",
          changeOrigin: true,
        },
        "/auth": {
          target: "http://localhost:3000",
          changeOrigin: true,
        },
      },
    },
    preview: {
      port: 5173,
      host: "localhost",
    },
  };
});
