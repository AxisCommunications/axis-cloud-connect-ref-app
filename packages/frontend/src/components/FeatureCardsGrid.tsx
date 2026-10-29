/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import { Body1, Card, makeStyles, Title3, tokens } from "@fluentui/react-components";
import { SettingsRegular, VideoClipRegular, VideoRegular } from "@fluentui/react-icons";
import type { FC } from "react";

import { LIVE_VIEW, RECORDINGS, REMOTE_OPERATIONS } from "@/constants/strings";

const useStyles = makeStyles({
  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: tokens.spacingHorizontalL,
  },
  featureCard: {
    padding: `${tokens.spacingVerticalL} ${tokens.spacingHorizontalL}`,
    height: "100%",
  },
  featureIcon: {
    fontSize: "32px",
    color: tokens.colorBrandForeground1,
    marginBottom: tokens.spacingVerticalM,
  },
  featureTitle: {
    marginBottom: tokens.spacingVerticalS,
  },
  featureDescription: {
    color: tokens.colorNeutralForeground2,
    lineHeight: tokens.lineHeightBase300,
  },
});

export const FeatureCardsGrid: FC = () => {
  const styles = useStyles();

  return (
    <div className={styles.featuresGrid}>
      <Card className={styles.featureCard}>
        <VideoRegular className={styles.featureIcon} />
        <Title3 className={styles.featureTitle}>{LIVE_VIEW.TITLE}</Title3>
        <Body1 className={styles.featureDescription}>{LIVE_VIEW.DESCRIPTION}</Body1>
      </Card>

      <Card className={styles.featureCard}>
        <SettingsRegular className={styles.featureIcon} />
        <Title3 className={styles.featureTitle}>{REMOTE_OPERATIONS.TITLE}</Title3>
        <Body1 className={styles.featureDescription}>{REMOTE_OPERATIONS.DESCRIPTION}</Body1>
      </Card>

      <Card className={styles.featureCard}>
        <VideoClipRegular className={styles.featureIcon} />
        <Title3 className={styles.featureTitle}>{RECORDINGS.TITLE}</Title3>
        <Body1 className={styles.featureDescription}>{RECORDINGS.DESCRIPTION}</Body1>
      </Card>
    </div>
  );
};
