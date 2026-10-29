/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

let initialization: Promise<void> | undefined;

// Imported on demand so the player and its WASM stay out of the initial bundle.
export const initVideoPlayer = (): Promise<void> => {
  if (initialization === undefined) {
    initialization = import("@axis-communications/axis-web-video-player").then((player) =>
      player.axisWebVideoInit(),
    );
  }
  return initialization;
};
