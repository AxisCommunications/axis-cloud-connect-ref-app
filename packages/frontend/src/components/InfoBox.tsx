/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import { Button, makeStyles, Text, tokens } from "@fluentui/react-components";
import { ChevronDown20Regular, ChevronUp20Regular } from "@fluentui/react-icons";
import { type FC, type ReactNode, useState } from "react";

const useStyles = makeStyles({
  infoBox: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalM}`,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  infoBoxHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoBoxCollapsed: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  content: {
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase200,
  },
  helpText: {
    color: tokens.colorNeutralForeground3,
  },
});

interface InfoBoxProps {
  readonly title: string;
  readonly header: string;
  readonly collapsedHelp: string;
  readonly collapseAriaLabel: string;
  readonly expandAriaLabel?: string;
  readonly children: ReactNode;
}

export const InfoBox: FC<InfoBoxProps> = ({
  title,
  header,
  collapsedHelp,
  collapseAriaLabel,
  expandAriaLabel,
  children,
}) => {
  const styles = useStyles();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isCollapsed) {
    return (
      <Button
        appearance="subtle"
        className={styles.infoBoxCollapsed}
        onClick={() => setIsCollapsed(false)}
        aria-expanded={false}
        aria-label={expandAriaLabel}
        icon={<ChevronDown20Regular />}
        iconPosition="after"
      >
        <Text weight="semibold">{title}</Text>
        <Text size={200} className={styles.helpText}>
          {collapsedHelp}
        </Text>
      </Button>
    );
  }

  return (
    <div className={styles.infoBox}>
      <div className={styles.infoBoxHeader}>
        <Text weight="semibold">{header}</Text>
        <Button
          appearance="subtle"
          size="small"
          icon={<ChevronUp20Regular />}
          onClick={() => setIsCollapsed(true)}
          aria-label={collapseAriaLabel}
        />
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  );
};
