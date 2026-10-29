/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import type { WebRtcLiveStreamContext } from "@axis-communications/axis-web-video-player";
import { makeStyles, Spinner, Text, tokens } from "@fluentui/react-components";
import { type FC, useEffect, useRef, useState } from "react";
import { InfoBox } from "@/components";
import { LIVE_VIEW } from "@/constants/strings";
import { useSignalingToken } from "@/hooks/useSignalingToken";
import { connectToSignalingServer, startLiveStream } from "./webrtc";

const ZOOM_STEPS_PER_WHEEL_EVENT = 250;
const ZOOM_DEBOUNCE_MS = 100;

// PTZ failures (limits, timeouts, cameras without PTZ) are intentionally not surfaced.
const ignorePtzError = () => undefined;

const attachPtzControls = (
  videoElement: HTMLDivElement,
  context: WebRtcLiveStreamContext,
): (() => void) => {
  let accumulatedZoom = 0;
  let zoomTimeout: number | undefined;

  const handleClick = (event: MouseEvent) => {
    context.center(event.offsetX, event.offsetY).catch(ignorePtzError);
  };

  // React's onWheel is passive, so only a native listener can stop page scrolling.
  const handleWheel = (event: WheelEvent) => {
    event.preventDefault();
    accumulatedZoom += event.deltaY > 0 ? -ZOOM_STEPS_PER_WHEEL_EVENT : ZOOM_STEPS_PER_WHEEL_EVENT;

    window.clearTimeout(zoomTimeout);
    zoomTimeout = window.setTimeout(() => {
      const zoomSteps = accumulatedZoom;
      accumulatedZoom = 0;
      context.zoomRelative(zoomSteps).catch(ignorePtzError);
    }, ZOOM_DEBOUNCE_MS);
  };

  videoElement.addEventListener("click", handleClick);
  videoElement.addEventListener("wheel", handleWheel, { passive: false });
  return () => {
    videoElement.removeEventListener("click", handleClick);
    videoElement.removeEventListener("wheel", handleWheel);
    window.clearTimeout(zoomTimeout);
  };
};

const useStyles = makeStyles({
  mainContainer: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalL,
    padding: tokens.spacingVerticalL,
    maxWidth: "900px",
    width: "100%",
  },
  videoContainer: {
    position: "relative",
    display: "flex",
    width: "100%",
    aspectRatio: "1280 / 720",
    backgroundColor: tokens.colorNeutralBackground3,
  },
  noVideoOverlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: tokens.spacingVerticalS,
  },
  videoElement: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
});

interface VideoStreamingProps {
  readonly serial: string;
  readonly organizationId: string;
  readonly setError: React.Dispatch<React.SetStateAction<string>>;
}

export const VideoStreaming: FC<VideoStreamingProps> = ({ serial, organizationId, setError }) => {
  const styles = useStyles();
  const { createOnTokenRequest } = useSignalingToken();
  const [isLoading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isStreamCancelled = false;
    let liveContext: Awaited<ReturnType<typeof startLiveStream>> | undefined;
    let detachPtzControls: (() => void) | undefined;

    const connectStream = async () => {
      setLoading(true);
      setError("");

      try {
        const el = ref.current;
        if (el === null) {
          throw new Error("No video element found");
        }
        const targetId = serial;

        const signalingConnection = await connectToSignalingServer(createOnTokenRequest);
        if (isStreamCancelled) {
          return;
        }

        const streamContext = await startLiveStream(
          signalingConnection,
          createOnTokenRequest,
          el,
          organizationId,
          targetId,
        );
        liveContext = streamContext;

        if (isStreamCancelled) {
          streamContext.disconnect();
          return;
        }

        detachPtzControls = attachPtzControls(el, streamContext);

        setError("");
      } catch (e) {
        if (!isStreamCancelled) {
          setError(e instanceof Error ? e.message : `Failed to start live stream: ${e}`);
        }
      } finally {
        if (!isStreamCancelled) {
          setLoading(false);
        }
      }
    };

    connectStream();

    return () => {
      isStreamCancelled = true;
      detachPtzControls?.();
      liveContext?.disconnect();
    };
  }, [serial, organizationId, createOnTokenRequest, setError]);

  return (
    <div className={styles.mainContainer}>
      <InfoBox
        title={LIVE_VIEW.TITLE}
        header={LIVE_VIEW.HEADER}
        collapsedHelp={` ${LIVE_VIEW.COLLAPSED_HELP}`}
        collapseAriaLabel={LIVE_VIEW.COLLAPSE_ARIA_LABEL}
      >
        <Text as="p">{LIVE_VIEW.DESCRIPTION}</Text>
      </InfoBox>

      <div className={styles.videoContainer}>
        {isLoading && (
          <div className={styles.noVideoOverlay}>
            <Spinner />
          </div>
        )}
        <div ref={ref} className={styles.videoElement} />
      </div>
    </div>
  );
};
