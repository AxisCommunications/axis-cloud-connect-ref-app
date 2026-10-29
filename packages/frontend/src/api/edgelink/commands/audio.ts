/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import type { CommandConfig } from "../types";

export const audioCommands: Record<string, CommandConfig> = {
  audioInput: {
    id: "audioInput",
    name: "Check Audio Input",
    description: "Check audio input status",
    cgi: "axis-cgi/param.cgi",
    method: "GET",
    queryParams: { action: "list", group: "Audio.*.Enabled" },
    successResponse: "Audio.*\\.Enabled=yes",
    example: {
      response: "root.Audio.A0.Enabled=yes",
    },
  },

  audioOutput: {
    id: "audioOutput",
    name: "Check Audio Output",
    description: "Check audio output capability",
    cgi: "axis-cgi/param.cgi",
    method: "GET",
    queryParams: { action: "list", group: "Properties.Audio.Source.*.Output" },
    successResponse: "Audio\\.Source\\..*\\.Output=yes",
  },
};
