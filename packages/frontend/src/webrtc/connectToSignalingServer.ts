/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import {
  SignalingClient,
  type SignalingConnection,
  type TokenRequestCallback,
} from "@axis-communications/axis-web-video-player";

/**
 * Shared WebRTC signaling connection utility.
 * Used by both video-streaming and playback features.
 */
export const connectToSignalingServer = async (
  tokenRequest: TokenRequestCallback,
): Promise<SignalingConnection> => {
  const signalingClient = new SignalingClient(tokenRequest);
  if (import.meta.env.VITE_VIDEO_SIGNALING_URL !== "") {
    signalingClient.setUrl(import.meta.env.VITE_VIDEO_SIGNALING_URL);
  }
  signalingClient.setErrorCallback((error) => {
    console.error("Signaling server error:", error);
  });

  return signalingClient.connect();
};
