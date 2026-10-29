/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import { Body1, Link, makeStyles, Spinner, Title1, tokens } from "@fluentui/react-components";
import type { FC } from "react";

import { LIST_DEVICES } from "@/constants/strings";

import { ConnectionAnimation, ICON_STATE } from "./ConnectionAnimation";
import { FeatureCardsGrid } from "./FeatureCardsGrid";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  spinnerContainer: {
    display: "flex",
    justifyContent: "center",
    padding: tokens.spacingVerticalL,
  },
  welcomeContainer: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXL,
    padding: `${tokens.spacingVerticalXXL} ${tokens.spacingHorizontalXL}`,
    maxWidth: "1200px",
    margin: "0 auto",
  },
  header: {
    textAlign: "center",
    padding: `${tokens.spacingVerticalL} 0`,
  },
  subtitle: {
    color: tokens.colorNeutralForeground2,
    marginTop: tokens.spacingVerticalM,
  },
  instruction: {
    color: tokens.colorNeutralForeground2,
    marginTop: tokens.spacingVerticalS,
  },
});

interface WelcomeToAppProps {
  readonly hasDevices: boolean;
  readonly isLoadingDevices: boolean;
}

export const WelcomeToApp: FC<WelcomeToAppProps> = ({ hasDevices, isLoadingDevices }) => {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      {isLoadingDevices ? (
        <div className={styles.spinnerContainer}>
          <Spinner size="medium" />
        </div>
      ) : hasDevices ? (
        <div className={styles.welcomeContainer}>
          <div className={styles.header}>
            <Title1>{LIST_DEVICES.WELCOME_TITLE}</Title1>
            <br></br>
            <Body1 className={styles.subtitle}>{LIST_DEVICES.WELCOME_SUBTITLE}</Body1>
          </div>

          <ConnectionAnimation connectionState={ICON_STATE.CONNECTED} />
          <FeatureCardsGrid />
        </div>
      ) : (
        <div className={styles.welcomeContainer}>
          <div className={styles.header}>
            <Title1>{LIST_DEVICES.WELCOME_TITLE}</Title1>
            <br></br>
            <Body1 className={styles.subtitle}>{LIST_DEVICES.NO_DEVICES_IN_ORG}</Body1>
            <br></br>
            <Body1 className={styles.instruction}>
              {LIST_DEVICES.ONBOARDING_PREFIX}
              <Link href={LIST_DEVICES.ONBOARDING_URL} target="_blank" rel="noopener noreferrer">
                {LIST_DEVICES.ONBOARDING_LINK_TEXT}
              </Link>
              .
            </Body1>
          </div>
        </div>
      )}
    </div>
  );
};
