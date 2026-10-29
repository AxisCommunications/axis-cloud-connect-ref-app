/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import {
  EdgeRecordingDetails,
  type PlaybackContext,
  type SignalingConnection,
  type TokenRequestCallback,
  WebRtcClient,
  type WebRtcContextError,
} from "@axis-communications/axis-web-video-player";

export const startPlayback = async (
  signalingConnection: SignalingConnection,
  tokenRequestCallback: TokenRequestCallback,
  videoElement: HTMLDivElement,
  orgId: string,
  targetId: string,
  recordingId: string,
  diskId: string,
  startTime: string,
): Promise<PlaybackContext<EdgeRecordingDetails>> => {
  const webRtcClient = new WebRtcClient({
    signalingConnection,
    tokenRequestCallback,
    orgId,
    targetId,
  });

  const recordingDetails = new EdgeRecordingDetails({
    recordingId,
    diskId,
    startTime,
  });

  let context: PlaybackContext<EdgeRecordingDetails>;
  try {
    context = await webRtcClient.startPlayback({
      recordingDetails,
      videoElement,
      autoPlay: false,
    });
  } catch (error) {
    const contextError = error as WebRtcContextError;
    switch (contextError.type) {
      case "SignalingConnectionFailed":
        console.error(`Failed to connect to signaling server: ${contextError.message}`);
        break;
      case "TargetConnectionFailed":
        console.error(`Failed to connect to target: ${contextError.message}`);
        break;
      case "TargetNotConnected":
        console.error("The target was not connected");
        break;
      case "TargetConnectionDenied":
        console.error(`Connecting to target not allowed: ${contextError.message}`);
        break;
      case "OperationNotSupportedByTarget":
        console.error(`The target did not support a requested operation: ${contextError.message}`);
        break;
      case "TargetPlaybackError":
        console.error(`The target could not fulfill the playback request: ${contextError.message}`);
        break;
      default:
        console.error(`Error: ${error}`);
        break;
    }
    throw error;
  }

  return context;
};
