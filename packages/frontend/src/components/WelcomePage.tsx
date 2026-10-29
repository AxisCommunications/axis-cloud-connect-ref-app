/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import {
  Body1Stronger,
  Button,
  makeStyles,
  Text,
  Title1,
  tokens,
} from "@fluentui/react-components";
import { type FC, useState } from "react";

import { WELCOME_PAGE } from "@/constants/strings";

import { ConnectionAnimation, type ConnectionState, ICON_STATE } from "./ConnectionAnimation";
import { DisplayError } from "./DisplayError";
import { FeatureCardsGrid } from "./FeatureCardsGrid";
import { WelcomeToApp } from "./WelcomeToApp";

// Just a placeholder duration for the connection animation before redirecting to the backend for authentication.
const ANIMATION_DURATION = 3000;

// Define styles
const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalL,
  },
  landingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: tokens.spacingVerticalXXXL,
    paddingTop: "50px",
  },
  descriptionText: {
    textWrap: "balance",
  },
});

interface WelcomePageProps {
  readonly organizationId: string | undefined;
  readonly hasDevices?: boolean;
  readonly isLoadingDevices?: boolean;
  readonly error?: string;
  readonly onConnect?: () => void;
}

export const WelcomePage: FC<WelcomePageProps> = ({
  organizationId,
  hasDevices,
  isLoadingDevices,
  error,
  onConnect,
}) => {
  const styles = useStyles();
  const [connectionState, setConnectionState] = useState<ConnectionState>(ICON_STATE.DISCONNECTED);

  if (onConnect !== undefined) {
    const handleConnect = () => {
      setConnectionState(() => ICON_STATE.CONNECTING);
      setTimeout(() => {
        onConnect();
      }, ANIMATION_DURATION);
    };

    return (
      <div className={styles.landingContainer}>
        <Title1>{WELCOME_PAGE.TITLE}</Title1>
        <Text as="p" size={400} align="center" className={styles.descriptionText}>
          {WELCOME_PAGE.DESCRIPTION}
        </Text>
        <ConnectionAnimation connectionState={connectionState} />
        <FeatureCardsGrid />
        <Body1Stronger>{WELCOME_PAGE.SIGN_IN}</Body1Stronger>
        <Button
          appearance="primary"
          size="large"
          onClick={handleConnect}
          disabled={connectionState === ICON_STATE.CONNECTING}
        >
          {connectionState === ICON_STATE.CONNECTING
            ? WELCOME_PAGE.CONNECTING_BUTTON
            : WELCOME_PAGE.CONNECT_BUTTON}
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {organizationId !== undefined && (
        <WelcomeToApp
          hasDevices={hasDevices ?? false}
          isLoadingDevices={isLoadingDevices ?? false}
        />
      )}
      {error !== undefined && <DisplayError error={error} />}
    </div>
  );
};
