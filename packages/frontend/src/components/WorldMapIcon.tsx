/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import { makeStyles, mergeClasses, tokens } from "@fluentui/react-components";
import type { FC } from "react";

import { type ConnectionState, ICON_STATE } from "./ConnectionAnimation";
import {
  AcsCameraFilled,
  AcsCameraRegular,
  CameraDomeFilled,
  CameraDomeRegular,
  InstallerDeviceFilled,
  InstallerDeviceRegular,
} from "./icons";
import { WorldMapSvg } from "./worldMapSvg";

const useStyles = makeStyles({
  root: {
    position: "relative",
    display: "inline-block",
    width: "320px",
  },
  deviceIcon: {
    position: "absolute",
    fontSize: "28px",
    transform: "translate(-50%, -50%)",
    pointerEvents: "none",
    zIndex: 1,
  },
  // North America
  deviceNorthAmerica: {
    left: "14%",
    top: "20%",
  },
  // Central America
  deviceCentralAmerica: {
    left: "13%",
    top: "45%",
  },
  // South America
  deviceSouthAmerica: {
    left: "22%",
    top: "67%",
  },
  // Scandinavia
  deviceScandinavia: {
    left: "48%",
    top: "9%",
  },
  // Western Europe
  deviceEurope: {
    left: "42%",
    top: "26%",
  },
  // West Africa
  deviceWestAfrica: {
    left: "48%",
    top: "47%",
  },
  // Central Africa
  deviceAfrica: {
    left: "50%",
    top: "70%",
  },
  // China
  deviceChina: {
    left: "71%",
    top: "28%",
  },
  // India
  deviceIndia: {
    left: "63%",
    top: "44%",
  },
  // Japan
  deviceJapan: {
    left: "81%",
    top: "24%",
  },
  // Southeast Asia
  deviceSoutheastAsia: {
    left: "77%",
    top: "52%",
  },
  // New Zealand
  deviceNewZealand: {
    left: "85%",
    top: "80%",
  },
  iconDisconnected: {
    color: tokens.colorBrandForeground1,
  },
  iconConnecting: {
    animationName: {
      "0%": { color: tokens.colorNeutralForeground4 },
      "30%": { color: tokens.colorBrandForeground1 },
      "70%": { color: tokens.colorBrandForeground1 },
      "100%": { color: tokens.colorNeutralForeground4 },
    },
    animationDuration: "2s",
    animationIterationCount: "infinite",
    animationTimingFunction: "ease-in-out",
    animationFillMode: "both",
  },
  delayGroup1: {
    animationDelay: "0s",
  },
  delayGroup2: {
    animationDelay: "0.5s",
  },
  delayGroup3: {
    animationDelay: "1s",
  },
  delayGroup4: {
    animationDelay: "1.5s",
  },
  iconConnected: {
    color: tokens.colorBrandForeground1,
  },
});

interface WorldMapIconProps {
  readonly connectionState: ConnectionState;
}

export const WorldMapIcon: FC<WorldMapIconProps> = ({ connectionState }) => {
  const styles = useStyles();

  const isConnected = connectionState === ICON_STATE.CONNECTED;
  const DeviceIconType1 = isConnected ? AcsCameraFilled : AcsCameraRegular;
  const DeviceIconType2 = isConnected ? CameraDomeFilled : CameraDomeRegular;
  const DeviceIconType3 = isConnected ? InstallerDeviceFilled : InstallerDeviceRegular;

  const iconColorClass =
    connectionState === ICON_STATE.DISCONNECTED
      ? styles.iconDisconnected
      : connectionState === ICON_STATE.CONNECTING
        ? styles.iconConnecting
        : styles.iconConnected;

  const delay1 = connectionState === ICON_STATE.CONNECTING ? styles.delayGroup1 : undefined;
  const delay2 = connectionState === ICON_STATE.CONNECTING ? styles.delayGroup2 : undefined;
  const delay3 = connectionState === ICON_STATE.CONNECTING ? styles.delayGroup3 : undefined;
  const delay4 = connectionState === ICON_STATE.CONNECTING ? styles.delayGroup4 : undefined;

  return (
    <div className={styles.root}>
      <WorldMapSvg />
      <DeviceIconType1
        className={mergeClasses(
          styles.deviceIcon,
          styles.deviceNorthAmerica,
          iconColorClass,
          delay3,
        )}
      />
      <DeviceIconType3
        className={mergeClasses(
          styles.deviceIcon,
          styles.deviceCentralAmerica,
          iconColorClass,
          delay2,
        )}
      />
      <DeviceIconType1
        className={mergeClasses(
          styles.deviceIcon,
          styles.deviceSouthAmerica,
          iconColorClass,
          delay4,
        )}
      />
      <DeviceIconType1
        className={mergeClasses(
          styles.deviceIcon,
          styles.deviceScandinavia,
          iconColorClass,
          delay2,
        )}
      />
      <DeviceIconType3
        className={mergeClasses(styles.deviceIcon, styles.deviceEurope, iconColorClass, delay1)}
      />
      <DeviceIconType2
        className={mergeClasses(styles.deviceIcon, styles.deviceWestAfrica, iconColorClass, delay4)}
      />
      <DeviceIconType3
        className={mergeClasses(styles.deviceIcon, styles.deviceAfrica, iconColorClass, delay1)}
      />
      <DeviceIconType1
        className={mergeClasses(styles.deviceIcon, styles.deviceChina, iconColorClass, delay2)}
      />
      <DeviceIconType3
        className={mergeClasses(styles.deviceIcon, styles.deviceIndia, iconColorClass, delay3)}
      />
      <DeviceIconType3
        className={mergeClasses(styles.deviceIcon, styles.deviceJapan, iconColorClass, delay1)}
      />
      <DeviceIconType2
        className={mergeClasses(
          styles.deviceIcon,
          styles.deviceSoutheastAsia,
          iconColorClass,
          delay4,
        )}
      />
      <DeviceIconType1
        className={mergeClasses(styles.deviceIcon, styles.deviceNewZealand, iconColorClass, delay2)}
      />
    </div>
  );
};
