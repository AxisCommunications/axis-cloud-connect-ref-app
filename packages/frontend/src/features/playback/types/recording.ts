/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

/**
 * Type definitions for device recordings from VAPIX API.
 */

/**
 * Represents a single recording from an Axis device.
 * Contains metadata about the recording including time, type, and video properties.
 */
export interface Recording {
  diskId: string;
  recordingId: string;
  startTime: Date;
  startTimeLocal: Date;
  stopTime: Date;
  stopTimeLocal: Date;
  recordingType: string;
  eventId: string;
  eventTrigger: string;
  recordingStatus: string;
  source: string;
  locked: boolean;
  video?: {
    mimetype: string;
    source: string;
    resolution: string;
    framerate: string;
    width: number;
    height: number;
  };
}

/**
 * Response from the VAPIX recording list API.
 */
export interface RecordingListResponse {
  totalNumberOfRecordings: number;
  numberOfRecordings: number;
  recordings: Recording[];
}
