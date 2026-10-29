/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import { makeStyles, mergeClasses, tokens } from "@fluentui/react-components";
import { PanelLeftHeaderKeyFilled, PanelLeftHeaderKeyRegular } from "@fluentui/react-icons";
import type { FC } from "react";

import { WorldMapIcon } from "./WorldMapIcon";

export const ICON_STATE = {
  DISCONNECTED: "disconnected",
  CONNECTING: "connecting",
  CONNECTED: "connected",
} as const;

const useStyles = makeStyles({
  root: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacingHorizontalXL,
    padding: tokens.spacingVerticalXL,
  },
  icon: {
    fontSize: "56px",
    transition: "color 0.4s ease",
  },
  iconDisconnected: {
    color: tokens.colorBrandForeground1,
  },
  iconConnecting: {
    color: tokens.colorBrandForeground1,
  },
  iconConnected: {
    color: tokens.colorBrandForeground1,
  },
  dashedLine: {
    width: "130px",
    borderTopWidth: "4px",
    borderTopStyle: "dashed",
    borderTopColor: tokens.colorBrandBackground,
  },
  dotsContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacingHorizontalS,
    width: "130px",
  },
  dot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: tokens.colorBrandBackground,
    opacity: 0,
    animationName: {
      "0%": { opacity: "0" },
      "30%": { opacity: "1" },
      "70%": { opacity: "1" },
      "100%": { opacity: "0" },
    },
    animationDuration: "1.4s",
    animationIterationCount: "infinite",
    animationTimingFunction: "ease-in-out",
    animationFillMode: "both",
  },
  dot2: {
    animationDelay: "0.27s",
  },
  dot3: {
    animationDelay: "0.54s",
  },
  connectorWrapper: {
    marginRight: "-30px",
    position: "relative",
    zIndex: 1,
  },
  solidLine: {
    width: "130px",
    height: "8px",
    backgroundImage: `linear-gradient(
    to bottom,
    ${tokens.colorBrandForeground1} 0%,
    ${tokens.colorNeutralBackground1} 50%,
    ${tokens.colorBrandForeground1} 100%
  )`,
  },
});

export type ConnectionState = "disconnected" | "connecting" | "connected";

const Connector: FC<{ readonly connectionState: ConnectionState }> = ({ connectionState }) => {
  const styles = useStyles();
  if (connectionState === ICON_STATE.CONNECTING) {
    return (
      <div className={styles.dotsContainer}>
        <div className={styles.dot} />
        <div className={mergeClasses(styles.dot, styles.dot2)} />
        <div className={mergeClasses(styles.dot, styles.dot3)} />
      </div>
    );
  }
  return (
    <div
      className={connectionState === ICON_STATE.CONNECTED ? styles.solidLine : styles.dashedLine}
    />
  );
};

/**
 * Component that displays an animation representing the connection state between the app and the devices.
 *
 * Animation states:
 * - `disconnected`: Icons are yellow with a dashed line between them.
 * - `connecting`: Icons are yellow and grey with animated dots between them.
 * - `connected`: Icons are filled yellow with a solid pipe line between them.
 */
export const ConnectionAnimation: FC<{ readonly connectionState: ConnectionState }> = ({
  connectionState,
}) => {
  const styles = useStyles();

  const isConnected = connectionState === ICON_STATE.CONNECTED;
  const iconClass = mergeClasses(
    styles.icon,
    connectionState === ICON_STATE.DISCONNECTED
      ? styles.iconDisconnected
      : connectionState === ICON_STATE.CONNECTING
        ? styles.iconConnecting
        : styles.iconConnected,
  );

  return (
    <div className={styles.root}>
      {isConnected ? (
        <PanelLeftHeaderKeyFilled className={iconClass} />
      ) : (
        <PanelLeftHeaderKeyRegular className={iconClass} />
      )}
      <div className={styles.connectorWrapper}>
        <Connector connectionState={connectionState} />
      </div>
      <WorldMapIcon connectionState={connectionState} />
    </div>
  );
};
