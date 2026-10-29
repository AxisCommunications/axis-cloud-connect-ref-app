/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import { makeStyles, Text, Tooltip, tokens } from "@fluentui/react-components";
import type { FC } from "react";

import { EDGELINK } from "@/constants/strings";

const useStyles = makeStyles({
  highlightedUrlContainer: {
    padding: tokens.spacingHorizontalS,
    marginBlockEnd: tokens.spacingVerticalS,
  },
  highlightedUrlText: {
    display: "block",
    marginLeft: "1.5",
    marginBottom: "0.5",
    wordBreak: "break-all",
  },
  legendContainer: {
    display: "flex",
    flexDirection: "row",
    gap: tokens.spacingHorizontalL,
    marginLeft: "1.5",
    marginBottom: "2",
    fontSize: "0.75rem",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
  },
  legendBox: {
    width: "12px",
    height: "12px",
    borderRadius: tokens.borderRadiusCircular,
  },
  primary: {
    color: tokens.colorPaletteRoyalBlueForeground2,
    backgroundColor: tokens.colorPaletteRoyalBlueBackground2,
  },
  secondary: {
    color: tokens.colorPalettePlumForeground2,
    backgroundColor: tokens.colorPalettePlumBackground2,
  },
  success: {
    color: tokens.colorPaletteForestForeground2,
    backgroundColor: tokens.colorPaletteForestBackground2,
  },
});

const legendItems = [
  { color: tokens.colorPaletteRoyalBlueBackground2, label: EDGELINK.HIGHLIGHT_ORG_ID },
  { color: tokens.colorPalettePlumBackground2, label: EDGELINK.HIGHLIGHT_DEVICE_MAC },
  { color: tokens.colorPaletteForestBackground2, label: EDGELINK.HIGHLIGHT_VAPIX },
];

interface HighlightedUrlProps {
  readonly baseUrl: string;
  readonly organizationId: string;
  readonly targetId: string;
  readonly cgi: string;
}

export const HighlightedUrl: FC<HighlightedUrlProps> = ({
  baseUrl,
  organizationId,
  targetId,
  cgi,
}) => {
  const styles = useStyles();

  return (
    <div className={styles.highlightedUrlContainer}>
      <div className={styles.highlightedUrlText}>
        {`${baseUrl}/organizations/`}
        <Tooltip content={EDGELINK.HIGHLIGHT_ORG_ID} relationship="description">
          <span className={styles.primary}>{organizationId}</span>
        </Tooltip>
        {"/targets/"}
        <Tooltip content={EDGELINK.HIGHLIGHT_DEVICE_MAC} relationship="description">
          <span className={styles.secondary}>{targetId}</span>
        </Tooltip>
        {"/"}
        <Tooltip content={EDGELINK.HIGHLIGHT_VAPIX} relationship="description">
          <span className={styles.success}>{cgi}</span>
        </Tooltip>
      </div>
      <div className={styles.legendContainer}>
        {legendItems.map((item) => (
          <div key={item.label} className={styles.legendItem}>
            {/* Inline style required: backgroundColor is driven by runtime data from legendItems */}
            <div className={styles.legendBox} style={{ backgroundColor: item.color }} />
            <Text size={200}>{item.label}</Text>
          </div>
        ))}
      </div>
    </div>
  );
};
