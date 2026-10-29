/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

/**
 * Utility functions for formatting dates and times in the recording browser.
 */

/**
 * Formats a date as a 24-hour time string (HH:MM:SS).
 */
export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
};

/**
 * Formats a date for display (e.g., "Dec 9, 2025").
 */
export const formatDateDisplay = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

/**
 * Generates a consistent date key for grouping recordings by day (YYYY-MM-DD).
 * Uses local time components to avoid UTC conversion issues.
 */
export const formatDateKey = (date: Date): string => {
  // Use local date components to avoid UTC conversion issues
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Keeps an existing date selection, or defaults to today when recordings exist for today.
 */
export const getDefaultSelectedDate = (
  selectedDate: Date | null,
  recordingsByDate: ReadonlyMap<string, readonly unknown[]>,
  today = new Date(),
): Date | null => {
  if (selectedDate !== null) {
    return selectedDate;
  }

  const todayRecordings = recordingsByDate.get(formatDateKey(today));
  if (todayRecordings === undefined || todayRecordings.length === 0) {
    return null;
  }

  return today;
};

/**
 * Calculates and formats the duration between two dates (e.g., "2h 15m" or "45s").
 */
export const calculateDuration = (start: Date, end: Date): string => {
  const durationMs = end.getTime() - start.getTime();
  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
};

/**
 * Formats a complete date and time with milliseconds (YYYY-MM-DD HH:MM:SS.mmm).
 * Used for the timeline playhead display.
 */
export const formatFullDateTime = (date: Date): string => {
  const dateStr =
    date.getFullYear() +
    "-" +
    String(date.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(date.getDate()).padStart(2, "0");
  const timeStr = date.toLocaleTimeString("en-US", { hour12: false });
  const ms = String(date.getMilliseconds()).padStart(3, "0");
  return `${dateStr} ${timeStr}.${ms}`;
};
