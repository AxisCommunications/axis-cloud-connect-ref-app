/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import { proxyVapixRequest } from "@/api/edgelink";

export const startRecording = async (
  organizationId: string,
  targetId: string,
  diskId = "SD_DISK",
): Promise<string> => {
  const response = await proxyVapixRequest(
    organizationId,
    targetId,
    `axis-cgi/record/record.cgi?diskid=${encodeURIComponent(diskId)}`,
  );
  const xmlResponse = await response.text();
  if (!response.ok) {
    throw new Error(`Start recording failed with status ${response.status}: ${xmlResponse}`);
  }

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlResponse, "text/xml");
  const recordElement = xmlDoc.querySelector("record");

  if (recordElement === null) {
    throw new Error("Failed to parse recording ID from start recording response");
  }

  const recordingId = recordElement.getAttribute("recordingid") ?? "";
  const result = recordElement.getAttribute("result") ?? "";

  if (result !== "OK") {
    const errormsg = recordElement.getAttribute("errormsg") ?? "";
    throw new Error(errormsg);
  }

  return recordingId;
};
