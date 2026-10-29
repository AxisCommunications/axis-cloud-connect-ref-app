/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import { type RefObject, useCallback, useEffect, useRef } from "react";

import { useRecordingContext } from "../context";
import type { Recording } from "../types";
import { formatDateKey } from "../utils";
import { Timebar } from "../utils/Timebar";

/**
 * Custom hook for managing the Timebar component lifecycle and interactions.
 * Handles initialization, cleanup, and seek callbacks.
 */
export const useTimebar = (
  timebarRef: RefObject<HTMLDivElement | null>,
  playRecording: (recording: Recording, isPlayAll: boolean, seekTime?: Date) => Promise<void>,
) => {
  const timebarInstance = useRef<Timebar | null>(null);
  const { playAllMode, currentRecordingId, playAllRecordings, playbackContext, recordingsByDate } =
    useRecordingContext();

  // Initialize Timebar - only once
  // biome-ignore lint/correctness/useExhaustiveDependencies: timebarRef.current is mutable; this effect intentionally runs once to init/destroy the Timebar instance.
  useEffect(() => {
    if (timebarRef.current !== null && timebarInstance.current === null) {
      try {
        timebarInstance.current = new Timebar(timebarRef.current);
      } catch (e) {
        console.error("Failed to initialize Timebar:", e);
      }
    }

    // Cleanup only on unmount
    return () => {
      if (timebarInstance.current !== null) {
        timebarInstance.current.destroy();
        timebarInstance.current = null;
      }
    };
  }, []); // Empty deps - only run once

  /**
   * Handles seeking in Play All mode by finding the target recording and time
   */
  const handlePlayAllSeek = useCallback(
    async (targetTime: Date) => {
      if (playAllRecordings.length === 0) {
        return;
      }

      const targetTimeMs = targetTime.getTime();
      let seekTime = targetTime;
      let targetRecording = playAllRecordings.find(
        (r) => targetTimeMs >= r.startTime.getTime() && targetTimeMs <= r.stopTime.getTime(),
      );

      if (targetRecording === undefined) {
        targetRecording = playAllRecordings.find((r) => r.startTime.getTime() > targetTimeMs);
        if (targetRecording !== undefined) {
          seekTime = targetRecording.startTime;
        } else {
          targetRecording = playAllRecordings[playAllRecordings.length - 1];
          if (targetRecording !== undefined && targetTimeMs > targetRecording.stopTime.getTime()) {
            seekTime = targetRecording.stopTime;
          }
        }
      }

      if (targetRecording !== undefined) {
        if (seekTime.getTime() > targetRecording.stopTime.getTime()) {
          seekTime = targetRecording.stopTime;
        }
        if (seekTime.getTime() < targetRecording.startTime.getTime()) {
          seekTime = targetRecording.startTime;
        }

        if (targetRecording.recordingId !== currentRecordingId) {
          // Different recording: Start it at the correct Seek Time
          await playRecording(targetRecording, true, seekTime);
        } else {
          // Same recording: Just Jump
          if (playbackContext !== null) {
            await playbackContext.jump(seekTime);
          }
        }
      }
    },
    [playAllRecordings, currentRecordingId, playbackContext, playRecording],
  );

  // Update seek callback when playAllMode or handlePlayAllSeek changes
  useEffect(() => {
    if (timebarInstance.current !== null) {
      timebarInstance.current.setOnSeek(async (time) => {
        if (playAllMode) {
          await handlePlayAllSeek(time);
        }
      });
    }
  }, [playAllMode, handlePlayAllSeek]);

  /**
   * Prepares and starts Play All mode for a given date
   */
  const handlePlayAll = useCallback(
    async (
      date: Date,
      videoContainerRef: RefObject<HTMLDivElement | null>,
      setPlayAllMode: (mode: boolean) => void,
      setPlayAllRecordings: (recordings: Recording[]) => void,
    ) => {
      const dateKey = formatDateKey(date);

      // Retrieve recordings for the specified day and sort them by start time
      const dayRecordings = (recordingsByDate.get(dateKey) ?? []).sort(
        (a, b) => a.startTime.getTime() - b.startTime.getTime(),
      );

      // If there are no recordings for the selected day, exit early
      if (dayRecordings.length === 0) {
        return;
      }

      setPlayAllMode(true);
      setPlayAllRecordings(dayRecordings);

      // Show video container FIRST to ensure Timebar has a visible container
      if (videoContainerRef.current) {
        videoContainerRef.current.style.display = "flex";
      }

      // Show timebar
      if (timebarRef.current) {
        timebarRef.current.style.display = "block";
      }

      // Wait for next frame to ensure the container is rendered and has dimensions
      await new Promise((resolve) => requestAnimationFrame(resolve));

      const startMs = dayRecordings[0].startTime.getTime();
      const endMs = dayRecordings[dayRecordings.length - 1].stopTime.getTime();

      if (timebarInstance.current) {
        timebarInstance.current.resize();
        timebarInstance.current.setRecordings(dayRecordings);

        await new Promise((resolve) => requestAnimationFrame(resolve));

        timebarInstance.current.fitToRange(new Date(startMs), new Date(endMs));
      }

      await playRecording(dayRecordings[0], true);
    },
    [recordingsByDate, timebarRef, playRecording],
  );

  return {
    timebarInstance,
    handlePlayAll,
  };
};
