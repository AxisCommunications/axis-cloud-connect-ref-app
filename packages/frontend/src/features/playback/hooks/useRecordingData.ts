/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import { useCallback } from "react";

import { listRecordings, startRecording, stopRecording } from "../api";
import { useRecordingContext } from "../context";
import type { Recording } from "../types";
import { formatDateKey, getDefaultSelectedDate } from "../utils";

/**
 * Custom hook for managing recording data and performing recording operations.
 * Handles fetching, starting, stopping recordings and event-based recording setup.
 */
export const useRecordingData = () => {
  const {
    orgId,
    targetId,
    setRecordingsByDate,
    setSelectedDate,
    setIsLoading,
    setError,
    setActionMessage,
    activeRecordingId,
    setActiveRecordingId,
    setIsActionLoading,
  } = useRecordingContext();

  /**
   * Fetches recordings from the device and organizes them by date
   */
  const loadRecordingsData = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await listRecordings(orgId, targetId);

      const map = new Map<string, Recording[]>();
      for (const recording of response.recordings) {
        const dateKey = formatDateKey(recording.startTimeLocal);
        if (!map.has(dateKey)) {
          map.set(dateKey, []);
        }
        map.get(dateKey)?.push(recording);
      }
      setRecordingsByDate(map);
      setSelectedDate((currentSelectedDate) => getDefaultSelectedDate(currentSelectedDate, map));
      return true;
    } catch (e) {
      setError(
        e instanceof Error ? e.message.replace("Target", "Device") : "Failed to load recordings",
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [orgId, targetId, setRecordingsByDate, setSelectedDate, setIsLoading, setError]);

  /**
   * Polls for recording updates with exponential backoff
   */
  const pollForUpdates = useCallback(async () => {
    const delaysMs = [0, 500, 1000, 2000];
    for (const delayMs of delaysMs) {
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      const ok = await loadRecordingsData();
      if (ok) {
        return;
      }
    }
  }, [loadRecordingsData]);

  /**
   * Starts a new manual recording
   */
  const handleStartRecording = useCallback(async () => {
    setIsActionLoading(true);
    setActionMessage(null);
    try {
      const id = await startRecording(orgId, targetId);
      setActiveRecordingId(id);
      setActionMessage("Recording started successfully.");
      // Poll for updates to ensure the new recording appears in the list
      void pollForUpdates();
    } catch (e) {
      const errorMsg =
        e !== null && e !== "" && String(e).includes("SD_DISK")
          ? ": Install or format the SD card"
          : "";
      setError(`Failed to start recording${errorMsg}`);
    } finally {
      setIsActionLoading(false);
    }
  }, [
    orgId,
    targetId,
    setActiveRecordingId,
    setActionMessage,
    setError,
    setIsActionLoading,
    pollForUpdates,
  ]);

  /**
   * Stops the active recording
   */
  const handleStopRecording = useCallback(async () => {
    if (activeRecordingId === null) {
      return;
    }
    setIsActionLoading(true);
    setActionMessage(null);
    try {
      await stopRecording(orgId, targetId, activeRecordingId);
      setActiveRecordingId(null);
      setActionMessage("Recording stopped successfully.");
      void pollForUpdates();
    } catch {
      setError("Failed to stop recording");
    } finally {
      setIsActionLoading(false);
    }
  }, [
    activeRecordingId,
    orgId,
    targetId,
    setActiveRecordingId,
    setActionMessage,
    setError,
    setIsActionLoading,
    pollForUpdates,
  ]);

  /**
   * Stops a specific recording from the list
   */
  const handleStopRecordingFromList = useCallback(
    async (recordingId: string) => {
      setIsActionLoading(true);
      setActionMessage(null);
      try {
        await stopRecording(orgId, targetId, recordingId);
        if (activeRecordingId === recordingId) {
          setActiveRecordingId(null);
        }
        setActionMessage("Recording stopped successfully.");
        void pollForUpdates();
      } catch {
        setError("Failed to stop recording");
      } finally {
        setIsActionLoading(false);
      }
    },
    [
      orgId,
      targetId,
      activeRecordingId,
      setActiveRecordingId,
      setActionMessage,
      setError,
      setIsActionLoading,
      pollForUpdates,
    ],
  );

  return {
    loadRecordingsData,
    handleStartRecording,
    handleStopRecording,
    handleStopRecordingFromList,
  };
};
