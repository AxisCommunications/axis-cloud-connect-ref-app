/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import type { DeviceInfo } from "../types";

/**
 * Device information utility functions.
 * Used for building display-only request previews in the EdgeLink operations UI.
 */
export const deviceInfoUtils = {
  getDeviceInfo: (organizationId: string, targetId: string): DeviceInfo => ({
    organizationId,
    targetId,
    edgelinkBaseUrl: import.meta.env.VITE_EDGELINK_BASE_URL ?? "",
  }),
};
