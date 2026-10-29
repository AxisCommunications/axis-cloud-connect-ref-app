/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import { makeStyles, Spinner, Tab, TabList, tokens } from "@fluentui/react-components";
import type { FC } from "react";
import { lazy, Suspense, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LIVE_VIEW, RECORDINGS, REMOTE_OPERATIONS } from "@/constants/strings";
import { initVideoPlayer } from "@/webrtc/initVideoPlayer";
import { DisplayError } from "./DisplayError";

const VideoStreaming = lazy(async () => {
  const [module] = await Promise.all([import("../features/video-streaming"), initVideoPlayer()]);
  return { default: module.VideoStreaming };
});

const Playback = lazy(async () => {
  const [module] = await Promise.all([import("../features/playback"), initVideoPlayer()]);
  return { default: module.Playback };
});

const EdgelinkOperations = lazy(async () => {
  const module = await import("../features/edgelink-operations");
  return { default: module.EdgelinkOperations };
});

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: tokens.spacingVerticalL,
    width: "100%",
  },
});

interface TabConfig {
  readonly enabled: boolean;
  readonly label: string;
  readonly urlIdentifier: string;
}

const tabSettings = {
  tabs: {
    liveView: {
      enabled: true,
      label: LIVE_VIEW.TITLE,
      urlIdentifier: "live-view",
    },
    remoteOperations: {
      enabled: true,
      label: REMOTE_OPERATIONS.TITLE,
      urlIdentifier: "remote-operations",
    },
    recordings: {
      enabled: true,
      label: RECORDINGS.TITLE,
      urlIdentifier: "recordings",
    },
  } satisfies Record<string, TabConfig>,
} as const;

type DeviceProps = {
  readonly serial: string;
  readonly organizationId: string;
};

const enabledTabs = Object.entries(tabSettings.tabs).filter(([_, config]) => config.enabled);

const getActiveTabKey = (pathname: string): string => {
  const lastSegment = pathname.split("/").pop();
  const matched = enabledTabs.find(([_, config]) => config.urlIdentifier === lastSegment);
  if (matched !== undefined) {
    return matched[0];
  }
  // Default to first enabled tab
  return enabledTabs.length > 0 ? enabledTabs[0][0] : "";
};

export const Device: FC<DeviceProps> = ({ serial, organizationId }) => {
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const styles = useStyles();

  const activeTabKey = getActiveTabKey(location.pathname);

  const handleTabSelect = (_event: unknown, data: { value: unknown }) => {
    const tabKey = data.value as string;
    const tabConfig = tabSettings.tabs[tabKey as keyof typeof tabSettings.tabs];
    if (tabConfig !== undefined) {
      navigate(`/devices/${serial}/${tabConfig.urlIdentifier}`);
    }
  };

  return (
    <div className={styles.container}>
      <TabList selectedValue={activeTabKey} onTabSelect={handleTabSelect}>
        {enabledTabs.map(([key, config]) => (
          <Tab key={key} value={key}>
            {config.label}
          </Tab>
        ))}
      </TabList>

      <Suspense fallback={<Spinner size="medium" />}>
        {activeTabKey === "liveView" && (
          <VideoStreaming serial={serial} organizationId={organizationId} setError={setError} />
        )}
        {activeTabKey === "remoteOperations" && (
          <EdgelinkOperations organizationId={organizationId} targetId={serial} />
        )}
        {activeTabKey === "recordings" && (
          <Playback serial={serial} organizationId={organizationId} />
        )}
      </Suspense>
      {error !== "" && <DisplayError error={error} />}
    </div>
  );
};
