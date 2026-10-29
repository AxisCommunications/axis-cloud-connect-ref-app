/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import type { CommandConfig } from "../types";

export const ptzCommands: Record<string, CommandConfig> = {
  ptzInfo: {
    id: "ptzInfo",
    name: "PTZ Capabilities",
    description: "Get PTZ capabilities information",
    cgi: "axis-cgi/com/ptz.cgi",
    method: "GET",
    queryParams: { info: "1" },
    successResponse: "Available commands",
  },
};
