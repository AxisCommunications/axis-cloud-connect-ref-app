/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import type { CommandCategory, CommandConfig } from "../types";
import { audioCommands } from "./audio";
import { connectivityCommands } from "./connectivity";
import { deviceCommands } from "./device";
import { overlayCommands } from "./overlay";
import { ptzCommands } from "./ptz";
import { usersCommands } from "./users";

/**
 * All command categories with their commands, for UI display.
 * To add a new category: create a new file in this folder and add it here.
 */
export const COMMANDS_BY_CATEGORY: Readonly<Record<string, CommandCategory>> = {
  device: {
    name: "Device Information",
    description: "Basic device information and settings",
    commands: deviceCommands,
  },
  audio: {
    name: "Audio Features",
    description: "Audio input/output capabilities",
    commands: audioCommands,
  },
  ptz: {
    name: "PTZ Controls",
    description: "Pan/Tilt/Zoom operations",
    commands: ptzCommands,
  },
  connectivity: {
    name: "Connectivity",
    description: "Device connectivity status",
    commands: connectivityCommands,
  },
  overlay: {
    name: "Video Overlay",
    description: "Text and image overlay management",
    commands: overlayCommands,
  },
  users: {
    name: "User Management",
    description: "User account operations",
    commands: usersCommands,
  },
};

/**
 * Flat map of all commands keyed by command ID.
 */
export const EDGELINK_COMMANDS: Readonly<Record<string, CommandConfig>> = Object.values(
  COMMANDS_BY_CATEGORY,
).reduce<Record<string, CommandConfig>>((acc, category) => {
  for (const [key, command] of Object.entries(category.commands)) {
    acc[key] = command;
  }
  return acc;
}, {});
