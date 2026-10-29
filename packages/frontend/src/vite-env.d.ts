/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

/// <reference types="vite/client" />
/** biome-ignore-all lint/correctness/noUnusedVariables: TypeScript merges it with Vite's built-in ImportMeta type globally*/

interface ImportMetaEnv {
  readonly VITE_ACC_BASE_URL: string;
  readonly VITE_EDGELINK_BASE_URL: string;
  readonly VITE_VIDEO_SIGNALING_URL: string;

  // API configuration
  readonly VITE_API_BASE_URL: string;

  // Axis Device Assistant(ADA)
  readonly VITE_ADA_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
