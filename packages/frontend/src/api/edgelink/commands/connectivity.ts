/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import type { CommandConfig } from "../types";

export const connectivityCommands: Record<string, CommandConfig> = {
  systemReady: {
    id: "systemReady",
    name: "System Ready Check",
    description: "Check if the device is connected and ready",
    cgi: "axis-cgi/systemready.cgi",
    method: "POST",
    contentType: "application/json",
    requestBody: {
      apiVersion: "1.0",
      method: "systemready",
      params: { timeout: 10 },
    },
    buildBody: () => ({
      apiVersion: "1.0",
      method: "systemready",
      params: { timeout: 10 },
    }),
    successResponse: "systemready.*yes",
  },
};
