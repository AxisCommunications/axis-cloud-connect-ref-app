/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

/**
 * Request data structure used for building HTTP requests and generating cURL commands.
 */
export interface RequestData {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string | Record<string, unknown>;
}

/**
 * Response data structure containing HTTP response information.
 */
export interface RequestResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
}

/**
 * Complete device information for EdgeLink operations.
 * In the EdgeLink API, "targetId" is the device identifier used in API calls.
 */
export interface DeviceInfo {
  organizationId: string;
  targetId: string;
  edgelinkBaseUrl: string;
}
