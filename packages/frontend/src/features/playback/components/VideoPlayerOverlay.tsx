/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import { Button, makeStyles, mergeClasses, Text, Title3, tokens } from "@fluentui/react-components";
import { Dismiss24Regular, Pause24Regular, Play24Regular } from "@fluentui/react-icons";
import type { FC, RefObject } from "react";

import { RECORDINGS } from "@/constants/strings";
import { useRecordingContext } from "../context";
import { formatFullDateTime } from "../utils";

const useStyles = makeStyles({
  videoOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
    padding: "20px",
    boxSizing: "border-box",
  },
  videoHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: tokens.colorNeutralForegroundInverted,
    marginBottom: tokens.spacingVerticalM,
  },
  videoContainer: {
    flexGrow: 1,
    backgroundColor: "black",
    position: "relative",
  },
  videoControls: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalM,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: tokens.borderRadiusMedium,
  },
  playPauseButton: {
    minWidth: "100px",
    color: "white",
    ":hover": {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
  },
  progressBar: {
    flexGrow: 1,
  },
  timebarContainer: {
    marginTop: tokens.spacingVerticalM,
    borderRadius: tokens.borderRadiusMedium,
  },
  hidden: {
    display: "none",
  },
  displayBlock: {
    display: "block",
  },
  playbackTimeText: {
    color: "white",
    fontSize: "14px",
    marginLeft: "auto",
  },
});

interface VideoPlayerOverlayProps {
  readonly videoContainerRef: RefObject<HTMLDivElement | null>;
  readonly videoElementRef: RefObject<HTMLDivElement | null>;
  readonly progressBarRef: RefObject<HTMLInputElement | null>;
  readonly playPauseBtnRef: RefObject<HTMLButtonElement | null>;
  readonly timebarRef: RefObject<HTMLDivElement | null>;
  readonly onClose: () => void;
  readonly onPlayPause: () => Promise<void>;
  readonly onProgressBarMouseDown: () => void;
  readonly onProgressBarMouseUp: () => void;
  readonly onSeek: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

/**
 * VideoPlayerOverlay provides the full-screen video playback interface.
 * Displays the video player, controls, progress bar, and timeline (in Play All mode).
 */
export const VideoPlayerOverlay: FC<VideoPlayerOverlayProps> = ({
  videoContainerRef,
  videoElementRef,
  progressBarRef,
  playPauseBtnRef,
  timebarRef,
  onClose,
  onPlayPause,
  onProgressBarMouseDown,
  onProgressBarMouseUp,
  onSeek,
}) => {
  const styles = useStyles();
  const { playAllMode, isPlaying, playbackContext, currentPlaybackTime } = useRecordingContext();

  return (
    <div ref={videoContainerRef} className={mergeClasses(styles.videoOverlay, styles.hidden)}>
      <div className={styles.videoHeader}>
        <Title3>
          {playAllMode ? RECORDINGS.OVERLAY_PLAY_ALL_MODE : RECORDINGS.OVERLAY_SINGLE_MODE}
        </Title3>
        <Button appearance="primary" icon={<Dismiss24Regular />} onClick={onClose}>
          {RECORDINGS.OVERLAY_CLOSE}
        </Button>
      </div>
      <div ref={videoElementRef} className={styles.videoContainer} />

      <div className={styles.videoControls}>
        <Button
          ref={playPauseBtnRef}
          appearance="transparent"
          className={styles.playPauseButton}
          icon={isPlaying ? <Pause24Regular /> : <Play24Regular />}
          onClick={onPlayPause}
          disabled={!playbackContext}
        >
          {isPlaying ? RECORDINGS.OVERLAY_PAUSE : RECORDINGS.OVERLAY_PLAY}
        </Button>
        <input
          type="range"
          ref={progressBarRef}
          className={mergeClasses(
            styles.progressBar,
            playAllMode ? styles.hidden : styles.displayBlock,
          )}
          defaultValue="0"
          onMouseDown={onProgressBarMouseDown}
          onMouseUp={onProgressBarMouseUp}
          onChange={onSeek}
        />
        {playAllMode && (
          <Text className={styles.playbackTimeText}>
            {currentPlaybackTime !== null ? formatFullDateTime(currentPlaybackTime) : ""}
          </Text>
        )}
      </div>

      <div
        ref={timebarRef}
        className={mergeClasses(
          styles.timebarContainer,
          playAllMode ? styles.displayBlock : styles.hidden,
        )}
      />
    </div>
  );
};
