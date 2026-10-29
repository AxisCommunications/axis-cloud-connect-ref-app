/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import { useEffect, useRef, useState } from "react";
import { listDevicesPage, listResourceGroups } from "../api";
import type { Device, ResourceGroup } from "../api/acc/types";

export interface GroupDevicesState {
  readonly devices: Device[];
  /** Cursor for the next page, or undefined when every page has been loaded. */
  readonly nextCursor: string | undefined;
  readonly isLoading: boolean;
  readonly error: string;
}

interface ResourceGroupsState {
  readonly resourceGroups: ResourceGroup[];
  readonly isLoading: boolean;
  readonly error: string;
}

const EMPTY_GROUP_STATE: GroupDevicesState = {
  devices: [],
  nextCursor: undefined,
  isLoading: false,
  error: "",
};

const toErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : `Unknown error: ${error}`;
};

/**
 * Loads the organization's resource groups up front and each group's devices on demand,
 * one page at a time, via the ACC `devices?resourceGroupId=` filter.
 */
export const useResourceGroupDevices = (organizationId: string | undefined) => {
  const [groupsState, setGroupsState] = useState<ResourceGroupsState>({
    resourceGroups: [],
    isLoading: organizationId !== undefined,
    error: "",
  });
  // A group id is absent until its first page has been requested.
  const [devicesByGroup, setDevicesByGroup] = useState<Record<string, GroupDevicesState>>({});
  // Lets in-flight device requests detect that the organization changed.
  const organizationIdRef = useRef(organizationId);

  useEffect(() => {
    organizationIdRef.current = organizationId;
    setDevicesByGroup({});

    if (organizationId === undefined) {
      setGroupsState({ resourceGroups: [], isLoading: false, error: "" });
      return;
    }

    let cancelled = false;
    setGroupsState({ resourceGroups: [], isLoading: true, error: "" });

    listResourceGroups(organizationId).then(
      (resourceGroups) => {
        if (!cancelled) {
          setGroupsState({ resourceGroups, isLoading: false, error: "" });
        }
      },
      (error: unknown) => {
        if (!cancelled) {
          setGroupsState({ resourceGroups: [], isLoading: false, error: toErrorMessage(error) });
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  const updateGroup = (
    resourceGroupId: string,
    update: (current: GroupDevicesState) => GroupDevicesState,
  ) => {
    setDevicesByGroup((previous) => ({
      ...previous,
      [resourceGroupId]: update(previous[resourceGroupId] ?? EMPTY_GROUP_STATE),
    }));
  };

  /** Fetches the first page of a group's devices, or the next page if some are already loaded. */
  const loadDevices = async (resourceGroupId: string) => {
    const current = devicesByGroup[resourceGroupId] ?? EMPTY_GROUP_STATE;
    if (organizationId === undefined || current.isLoading) {
      return;
    }

    const requestedOrganizationId = organizationId;
    updateGroup(resourceGroupId, (group) => ({ ...group, isLoading: true, error: "" }));

    try {
      const page = await listDevicesPage(requestedOrganizationId, {
        resourceGroupId,
        cursor: current.nextCursor,
      });
      if (organizationIdRef.current !== requestedOrganizationId) {
        return;
      }
      updateGroup(resourceGroupId, (group) => ({
        devices: [...group.devices, ...page.items],
        nextCursor: page.pagination.hasMore ? page.pagination.nextCursor : undefined,
        isLoading: false,
        error: "",
      }));
    } catch (error) {
      if (organizationIdRef.current !== requestedOrganizationId) {
        return;
      }
      updateGroup(resourceGroupId, (group) => ({
        ...group,
        isLoading: false,
        error: toErrorMessage(error),
      }));
    }
  };

  return {
    resourceGroups: groupsState.resourceGroups,
    isLoadingGroups: groupsState.isLoading,
    groupsError: groupsState.error,
    devicesByGroup,
    loadDevices,
  };
};
