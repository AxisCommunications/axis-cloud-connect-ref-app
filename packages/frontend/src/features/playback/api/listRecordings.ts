/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import { proxyVapixRequest } from "@/api/edgelink";
import type { Recording, RecordingListResponse } from "../types/recording";

export const listRecordings = async (
  organizationId: string,
  targetId: string,
): Promise<RecordingListResponse> => {
  const response = await proxyVapixRequest(
    organizationId,
    targetId,
    `axis-cgi/record/list.cgi?recordingid=all`,
  );
  if (!response.ok) {
    throw new Error(`Failed to list recordings: status ${response.status}`);
  }
  const xmlResponse = await response.text();
  return parseRecordingListXML(xmlResponse);
};

const parseRecordingListXML = (xmlString: string): RecordingListResponse => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");

  const recordingsElement = xmlDoc.querySelector("recordings");
  if (recordingsElement === null) {
    throw new Error("Invalid XML response: missing recordings element");
  }

  const totalNumberOfRecordings = Number.parseInt(
    recordingsElement.getAttribute("totalnumberofrecordings") ?? "0",
    10,
  );
  const numberOfRecordings = Number.parseInt(
    recordingsElement.getAttribute("numberofrecordings") ?? "0",
    10,
  );

  const recordingElements = xmlDoc.querySelectorAll("recording");
  const recordings: Recording[] = [];

  for (const recordingElement of recordingElements) {
    const videoElement = recordingElement.querySelector("video");

    // Parse times, handling empty values for ongoing recordings
    const startTimeStr = recordingElement.getAttribute("starttime") ?? "";
    const startTimeLocalStr = recordingElement.getAttribute("starttimelocal") ?? "";
    const stopTimeStr = recordingElement.getAttribute("stoptime") ?? "";
    const stopTimeLocalStr = recordingElement.getAttribute("stoptimelocal") ?? "";

    const recording: Recording = {
      diskId: recordingElement.getAttribute("diskid") ?? "",
      recordingId: recordingElement.getAttribute("recordingid") ?? "",
      startTime: new Date(startTimeStr),
      startTimeLocal: new Date(startTimeLocalStr),
      // If stoptime is empty, the recording is still active - use current time as placeholder
      stopTime: stopTimeStr !== "" ? new Date(stopTimeStr) : new Date(),
      stopTimeLocal: stopTimeLocalStr !== "" ? new Date(stopTimeLocalStr) : new Date(),
      recordingType: recordingElement.getAttribute("recordingtype") ?? "",
      eventId: recordingElement.getAttribute("eventid") ?? "",
      eventTrigger: recordingElement.getAttribute("eventtrigger") ?? "",
      recordingStatus: recordingElement.getAttribute("recordingstatus") ?? "",
      source: recordingElement.getAttribute("source") ?? "",
      locked: recordingElement.getAttribute("locked") === "Yes",
    };

    if (videoElement) {
      recording.video = {
        mimetype: videoElement.getAttribute("mimetype") ?? "",
        source: videoElement.getAttribute("source") ?? "",
        resolution: videoElement.getAttribute("resolution") ?? "",
        framerate: videoElement.getAttribute("framerate") ?? "",
        width: Number.parseInt(videoElement.getAttribute("width") ?? "0", 10),
        height: Number.parseInt(videoElement.getAttribute("height") ?? "0", 10),
      };
    }

    recordings.push(recording);
  }

  return {
    totalNumberOfRecordings,
    numberOfRecordings,
    recordings,
  };
};
