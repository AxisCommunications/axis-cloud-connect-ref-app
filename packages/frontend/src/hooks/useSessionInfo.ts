/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import { useCallback, useEffect, useState } from "react";
import { getOrganization } from "../api";
import type { Organization } from "../api/acc/types";
import { isAuthenticated as checkAuth } from "../auth";

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL ?? "";

/** Extracts the organization UUID from an `axis:organization` ARN claim. */
const extractOrganizationId = (organizationArn: string): string | null => {
  const [, , hierarchy] = organizationArn.split(":");
  if (hierarchy === undefined || hierarchy === "") {
    return null;
  }
  return hierarchy.split("/").at(-1) ?? null;
};

interface UserInfo {
  sub: string | null;
  email: string | null;
  name: string | null;
  picture: string | null;
  "axis:organization": string | null;
}

interface SessionInfo {
  organizationId: string | null;
  organizationInfo: Organization | null;
}

/**
 * Derives session state from the backend /api/session-info endpoint and ACC API.
 */
export const useSessionInfo = (tokensCaptured: boolean) => {
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const initialize = useCallback(async () => {
    if (!checkAuth()) {
      setSessionInfo(null);
      setIsLoading(false);
      return;
    }

    // Fetch user info (decoded ID token claims) from the backend
    let orgArn: string | null = null;
    try {
      const response = await fetch(`${BACKEND_URL}/api/session-info`, {
        credentials: "include",
      });
      if (response.ok) {
        const userInfo: UserInfo = await response.json();
        orgArn = userInfo["axis:organization"] ?? null;
      }
    } catch {
      // User info fetch failed — not critical
    }

    const organizationId = orgArn !== null ? extractOrganizationId(orgArn) : null;

    // Fetch org info from the ACC REST API if we have an org id
    let organizationInfo: Organization | null = null;
    if (organizationId !== null) {
      try {
        organizationInfo = await getOrganization(organizationId);
      } catch {
        // Org fetch failed — not critical
      }
    }

    setSessionInfo({
      organizationId,
      organizationInfo,
    });
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!tokensCaptured) {
      return;
    }
    initialize();
  }, [initialize, tokensCaptured]);

  return { sessionInfo, isLoading };
};
