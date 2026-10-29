/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import { proxyVapixRequest } from "@/api/edgelink";

export const stopRecording = async (
  organizationId: string,
  targetId: string,
  recordingId: string,
): Promise<void> => {
  const response = await proxyVapixRequest(
    organizationId,
    targetId,
    `axis-cgi/record/stop.cgi?recordingid=${encodeURIComponent(recordingId)}`,
  );
  if (!response.ok) {
    throw new Error(`Stop recording failed with status ${response.status}`);
  }
};
