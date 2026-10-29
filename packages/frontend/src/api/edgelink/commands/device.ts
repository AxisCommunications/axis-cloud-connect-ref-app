/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import type { CommandConfig } from "../types";

export const deviceCommands: Record<string, CommandConfig> = {
  deviceInfo: {
    id: "deviceInfo",
    name: "Get Device Information",
    description: "Retrieve basic device information",
    cgi: "axis-cgi/param.cgi",
    method: "GET",
    queryParams: { action: "list", group: "Properties" },
    successResponse: "Properties",
    example: {
      description: "Lists all device properties",
      response: "root.Properties.Firmware.Version=10.9.0",
    },
  },

  videoCapability: {
    id: "videoCapability",
    name: "Check Video Capability",
    description: "Check if the device has a camera image source",
    cgi: "axis-cgi/param.cgi",
    method: "GET",
    queryParams: { action: "list", group: "ImageSource" },
    successResponse: "NbrOfSources=[1-9]",
  },

  rotation: {
    id: "rotation",
    name: "Set Image Rotation",
    description: "Rotate camera image",
    cgi: "axis-cgi/param.cgi",
    method: "GET",
    parameters: {
      angle: {
        type: "enum",
        values: [0, 90, 180, 270],
        required: true,
        description: "Rotation angle in degrees",
      },
    },
    queryParams: { action: "update" },
    buildQueryParams: (params) => ({
      action: "update",
      "ImageSource.I0.Rotation": params.angle ?? "",
    }),
    successResponse: "OK",
    example: {
      request: "/axis-cgi/param.cgi?action=update&ImageSource.I0.Rotation=90",
      response: "OK",
    },
  },
};
