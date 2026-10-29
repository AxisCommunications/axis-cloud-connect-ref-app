/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import type { CommandConfig } from "../types";

export const overlayCommands: Record<string, CommandConfig> = {
  textOverlay: {
    id: "textOverlay",
    name: "Add Text Overlay",
    description: "Add text overlay to video",
    cgi: "axis-cgi/dynamicoverlay/dynamicoverlay.cgi",
    method: "POST",
    contentType: "application/json",
    parameters: {
      text: {
        type: "string",
        required: true,
        description: "Text to display",
      },
      position: {
        type: "enum",
        values: ["topLeft", "topRight", "bottomLeft", "bottomRight"],
        default: "topLeft",
        required: false,
        description: "Position of the text",
      },
    },
    requestBody: {
      apiVersion: "1.0",
      context: "VaaS EdgeLink",
      method: "addText",
      params: { camera: 1, text: "", position: "", textColor: "white" },
    },
    buildBody: (params) => ({
      apiVersion: "1.0",
      context: "VaaS EdgeLink",
      method: "addText",
      params: {
        camera: 1,
        text: params.text ?? "",
        position: params.position ?? "topLeft",
        textColor: "white",
      },
    }),
    successResponse: "OK",
  },

  removeOverlay: {
    id: "removeOverlay",
    name: "Remove Image Overlay",
    description: "Remove image overlay",
    cgi: "axis-cgi/dynamicoverlay/dynamicoverlay.cgi",
    method: "POST",
    contentType: "application/json",
    parameters: {
      identity: {
        type: "integer",
        required: true,
        description: "identity for removing overlay",
      },
    },
    requestBody: {
      apiVersion: "1.0",
      context: "VaaS EdgeLink",
      method: "remove",
      params: { identity: "" },
    },
    buildBody: (params) => ({
      apiVersion: "1.0",
      context: "VaaS EdgeLink",
      method: "remove",
      params: {
        identity: params.identity ?? "",
      },
    }),
    successResponse: "OK",
  },

  listOverlays: {
    id: "listOverlays",
    name: "List Overlays",
    description: "List all overlays",
    cgi: "axis-cgi/dynamicoverlay/dynamicoverlay.cgi",
    method: "POST",
    contentType: "application/json",
    requestBody: {
      apiVersion: "1.0",
      context: "VaaS EdgeLink",
      method: "list",
      params: {},
    },
    buildBody: () => ({
      apiVersion: "1.0",
      context: "VaaS EdgeLink",
      method: "list",
      params: {},
    }),
    successResponse: "Overlays",
  },
};
