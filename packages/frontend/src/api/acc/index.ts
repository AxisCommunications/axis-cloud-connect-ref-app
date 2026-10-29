/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import { getToken } from "../../auth";
import type { Device, ListResponse, Organization, ResourceGroup } from "./types";

const PAGE_SIZE = 50;

/**
 * Sends a GET request to the ACC (Axis Cloud Connect) REST API.
 * Uses the access token from the token store as a Bearer credential.
 */
const request = async <T>(path: string, params?: URLSearchParams): Promise<T> => {
  const accessToken = await getToken();
  const query = params === undefined ? "" : `?${params.toString()}`;

  const response = await fetch(`${import.meta.env.VITE_ACC_BASE_URL}${path}${query}`, {
    headers: {
      authorization: `Bearer ${accessToken}`,
      accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`ACC request to ${path} failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
};

const organizationPath = (organizationId: string): string => {
  return `/organizations/${encodeURIComponent(organizationId)}`;
};

const createPageParams = (pageSize: number, cursor: string | undefined): URLSearchParams => {
  const params = new URLSearchParams({ pageSize: String(pageSize) });
  if (cursor !== undefined) {
    params.set("cursor", cursor);
  }
  return params;
};

/**
 * Collects every page of a cursor-paginated ACC list endpoint.
 * Follows `pagination.nextCursor` until `pagination.hasMore` is false.
 */
const fetchAllPages = async <T>(path: string): Promise<T[]> => {
  const items: T[] = [];
  let cursor: string | undefined;

  while (true) {
    const page = await request<ListResponse<T>>(path, createPageParams(PAGE_SIZE, cursor));
    items.push(...page.items);
    if (!page.pagination.hasMore || page.pagination.nextCursor === undefined) {
      break;
    }
    cursor = page.pagination.nextCursor;
  }

  return items;
};

export interface ListDevicesOptions {
  /** Only return devices placed directly in this resource group (not in its descendants). */
  readonly resourceGroupId?: string;
  readonly cursor?: string;
  readonly pageSize?: number;
}

export const getOrganization = async (organizationId: string): Promise<Organization> => {
  return request<Organization>(organizationPath(organizationId));
};

/** Fetches a single page of devices, optionally filtered by resource group. */
export const listDevicesPage = async (
  organizationId: string,
  options: ListDevicesOptions = {},
): Promise<ListResponse<Device>> => {
  const params = createPageParams(options.pageSize ?? PAGE_SIZE, options.cursor);
  if (options.resourceGroupId !== undefined) {
    params.set("resourceGroupId", options.resourceGroupId);
  }
  return request<ListResponse<Device>>(`${organizationPath(organizationId)}/devices`, params);
};

export const hasAnyDevices = async (organizationId: string): Promise<boolean> => {
  const page = await listDevicesPage(organizationId, { pageSize: 1 });
  return page.items.length > 0;
};

export const listResourceGroups = async (organizationId: string): Promise<ResourceGroup[]> => {
  return fetchAllPages<ResourceGroup>(`${organizationPath(organizationId)}/resource-groups`);
};
