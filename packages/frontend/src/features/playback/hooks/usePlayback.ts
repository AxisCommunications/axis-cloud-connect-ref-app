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
} from "@axis-communications/axis-web-video-player";
import { type RefObject, useCallback, useEffect, useRef } from "react";

import { useSignalingToken } from "@/hooks/useSignalingToken";
import { connectToSignalingServer } from "@/webrtc";

import { useRecordingContext } from "../context";
import type { Recording } from "../types";
import { startPlayback } from "../utils/playback";
import type { Timebar } from "../utils/Timebar";

/**
 * Custom hook for managing video playback state and operations.
 * Handles WebRTC playback initialization, state callbacks, and recording transitions.
 */
export const usePlayback = (
  videoElementRef: RefObject<HTMLDivElement | null>,
  videoContainerRef: RefObject<HTMLDivElement | null>,
  progressBarRef: RefObject<HTMLInputElement | null>,
  timebarInstance: RefObject<Timebar | null>,
  timebarRef: RefObject<HTMLDivElement | null>,
) => {
  const {
    orgId,
    targetId,
    setError,
    setCurrentRecordingId,
    playbackContext,
    setPlaybackContext,
    playAllMode,
    setPlayAllMode,
    playAllRecordings,
    currentRecordingId,
    isPlaying,
    setIsPlaying,
    setCurrentPlaybackTime,
  } = useRecordingContext();

  const playNextRecordingRef = useRef<() => void>(() => {});
  const isScrubbing = useRef(false);
  const playAllModeRef = useRef(playAllMode);

  const { createOnTokenRequest } = useSignalingToken();

  // Keep playAllModeRef in sync with playAllMode from context
  useEffect(() => {
    playAllModeRef.current = playAllMode;
  }, [playAllMode]);

  /**
   * Plays a single recording or continues playback in Play All mode
   */
  const playRecording = useCallback(
    async (recording: Recording, isPlayAll = false, seekTime?: Date) => {
      const setupCallbacks = (
        context: PlaybackContext<EdgeRecordingDetails>,
        isPlayAllGetter: () => boolean,
      ) => {
        context.setPositionChangedCallback((pos) => {
          setCurrentPlaybackTime(pos);
          if (isPlayAllGetter() && timebarInstance.current !== null) {
            timebarInstance.current.setCurrentTime(pos);
          }

          // Update progress bar if not scrubbing
          if (progressBarRef.current !== null && !isScrubbing.current) {
            progressBarRef.current.value = pos.getTime().toString();

            // Auto-pause at end
            const max = Number(progressBarRef.current.max);
            if (pos.getTime() >= max) {
              context.pause();
            }
          }
        });

        context.setPlayerStateChangedCallback((state) => {
          if (state === "playing") {
            setIsPlaying(true);
          } else if (state === "paused") {
            setIsPlaying(false);
          } else if (state === "ended") {
            setIsPlaying(false);
            if (isPlayAllGetter()) {
              playNextRecordingRef.current();
            }
          }
        });
      };

      if (videoElementRef.current === null) {
        return;
      }

      setCurrentRecordingId(recording.recordingId);
      setPlayAllMode(isPlayAll);

      // Show video container
      if (videoContainerRef.current !== null) {
        videoContainerRef.current.style.display = "flex";
      }

      try {
        const durationMs = recording.stopTime.getTime() - recording.startTime.getTime();
        const startTimeMs = recording.startTime.getTime();
        const endTimeMs = startTimeMs + durationMs;

        // Determine start time for playback
        const startIso =
          seekTime !== undefined ? seekTime.toISOString() : recording.startTime.toISOString();

        // Update Progress Bar limits for the new recording
        if (progressBarRef.current !== null) {
          progressBarRef.current.min = startTimeMs.toString();
          progressBarRef.current.max = endTimeMs.toString();
          progressBarRef.current.value = startTimeMs.toString();
        }

        let activeContext = playbackContext;

        if (playbackContext !== null) {
          // Change recording
          const recordingDetails = new EdgeRecordingDetails({
            recordingId: recording.recordingId,
            diskId: recording.diskId,
            startTime: startIso,
          });

          // Set up callbacks BEFORE changing recording
          setupCallbacks(playbackContext, () => isPlayAll);

          await playbackContext.changeRecording({
            recordingDetails,
            autoPlay: true,
          });
        } else {
          // Start new playback
          const signalingConnection = await connectToSignalingServer(createOnTokenRequest);

          activeContext = await startPlayback(
            signalingConnection,
            createOnTokenRequest,
            videoElementRef.current,
            orgId,
            targetId,
            recording.recordingId,
            recording.diskId,
            startIso,
          );

          setPlaybackContext(activeContext);

          // Set up callbacks ONLY ONCE - use refs to access current state
          setupCallbacks(activeContext, () => playAllModeRef.current);

          // Start playback after callbacks are set up
          await activeContext.play();
        }

        // Update Timebar if in Play All mode
        if (isPlayAll && timebarInstance.current !== null) {
          if (timebarRef.current !== null) {
            timebarRef.current.style.display = "block";
          }
          timebarInstance.current.resize();
        } else {
          if (timebarRef.current !== null) {
            timebarRef.current.style.display = "none";
          }
        }
      } catch (e) {
        setError(`Failed to play recording: ${String(e)}`);
      }
    },
    [
      playbackContext,
      createOnTokenRequest,
      orgId,
      targetId,
      videoElementRef,
      videoContainerRef,
      progressBarRef,
      timebarInstance,
      timebarRef,
      setCurrentRecordingId,
      setPlayAllMode,
      setPlaybackContext,
      setCurrentPlaybackTime,
      setIsPlaying,
      setError,
    ],
  );

  /**
   * Closes the video player overlay and cleans up playback state
   */
  const closeVideo = useCallback(() => {
    if (playbackContext !== null) {
      playbackContext.pause();
    }
    if (videoContainerRef.current !== null) {
      videoContainerRef.current.style.display = "none";
    }
    setCurrentRecordingId(null);
    setPlayAllMode(false);
    setIsPlaying(false);
  }, [playbackContext, videoContainerRef, setCurrentRecordingId, setPlayAllMode, setIsPlaying]);

  /**
   * Handles progress bar scrubbing to prevent conflicts with playback updates
   */
  const handleProgressBarMouseDown = useCallback(() => {
    isScrubbing.current = true;
  }, []);

  const handleProgressBarMouseUp = useCallback(() => {
    isScrubbing.current = false;
  }, []);

  /**
   * Handles seeking to a specific time via progress bar
   */
  const handleSeek = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (playbackContext !== null && isScrubbing.current) {
        const targetTime = new Date(Number.parseInt(e.target.value, 10));
        await playbackContext.jump(targetTime);
      }
    },
    [playbackContext],
  );

  /**
   * Toggles play/pause state
   */
  const handlePlayPause = useCallback(async () => {
    if (playbackContext === null) {
      return;
    }

    if (isPlaying) {
      await playbackContext.pause();
    } else {
      await playbackContext.play();
    }
  }, [playbackContext, isPlaying]);

  // Advance to the next recording when the current one ends in Play All mode.
  useEffect(() => {
    playNextRecordingRef.current = () => {
      const currentIndex = playAllRecordings.findIndex((r) => r.recordingId === currentRecordingId);
      if (currentIndex === -1) {
        return;
      }
      const nextRecording = playAllRecordings[currentIndex + 1];
      if (nextRecording === undefined) {
        return;
      }
      void playRecording(nextRecording, true);
    };
  }, [playAllRecordings, currentRecordingId, playRecording]);

  return {
    playRecording,
    closeVideo,
    handleProgressBarMouseDown,
    handleProgressBarMouseUp,
    handleSeek,
    handlePlayPause,
  };
};
