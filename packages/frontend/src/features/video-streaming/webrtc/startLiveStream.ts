/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import {
  EdgeLiveStreamDetails,
  type SignalingConnection,
  type TokenRequestCallback,
  WebRtcClient,
} from "@axis-communications/axis-web-video-player";

export const startLiveStream = async (
  signalingConnection: SignalingConnection,
  tokenRequestCallback: TokenRequestCallback,
  videoElement: HTMLDivElement,
  orgId: string,
  targetId: string,
) => {
  const webRtcClient = new WebRtcClient({
    signalingConnection,
    tokenRequestCallback,
    orgId,
    targetId,
  });

  const streamDetails = new EdgeLiveStreamDetails({
    videoReceive: true,
    videoOptions: {
      framerate: 30,
      height: 720,
      width: 1280,
    },
  });

  const liveContext = await webRtcClient.startLiveStream({
    streamDetails,
    videoElement,
  });
  return liveContext;
};
