/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

/**
 * An ACC organization.
 * Returned by the ACC REST API's `/v1/organizations` endpoints.
 */
export interface Organization {
  /** UUID uniquely identifying the organization. */
  id: string;
  /** Human-readable organization name. */
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * A device registered in ACC, typically an Axis camera.
 * Returned by the ACC REST API's `/v1/organizations/{orgId}/devices` endpoints.
 */
export interface Device {
  /** UUID uniquely identifying the device. */
  id: string;
  /** Human-readable device name (typically the model). */
  name: string;
  /** Device serial number. */
  serial: string;
  /** UUID of the resource group the device belongs to. */
  resourceGroupId: string;
  createdAt?: string;
}

/**
 * A resource group within an organization.
 * Returned by the ACC REST API's `/v1/organizations/{orgId}/resource-groups` endpoints.
 */
export interface ResourceGroup {
  /** UUID uniquely identifying the resource group. */
  id: string;
  /** Human-readable resource group name. */
  name: string;
  /** UUID of the parent resource group, or null for a root group. */
  parentId: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/** Cursor-based pagination metadata returned by ACC list endpoints. */
export interface Pagination {
  hasMore: boolean;
  nextCursor?: string;
}

/** Envelope shape returned by ACC list endpoints. */
export interface ListResponse<T> {
  items: T[];
  pagination: Pagination;
}
