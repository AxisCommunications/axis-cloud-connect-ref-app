/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import { Button, makeStyles, Text, tokens } from "@fluentui/react-components";
import { BuildingMultiple20Regular } from "@fluentui/react-icons";
import { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import type { Organization } from "@/api/acc/types";

import { APP } from "@/constants/strings";

import { hasAnyDevices } from "./api";
import {
  captureTokensFromCallback,
  isAuthenticated as checkAuth,
  login,
  restoreSession,
  useAuth,
} from "./auth";
import { CustomProfileMenu, Device, Layout, MainMenu, WelcomePage } from "./components";
import { useSessionInfo } from "./hooks/useSessionInfo";

const RETURN_URL_KEY = "returnUrl";

const useStyles = makeStyles({
  content: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "100%",
    padding: tokens.spacingVerticalM,
    overflow: "auto",
  },
  deviceContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    width: "100%",
    height: "100%",
  },
  headerBar: {
    display: "flex",
    alignItems: "center",
    height: "48px",
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    gap: tokens.spacingHorizontalM,
    backgroundColor: "#f0f0f0",
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  headerSpacer: {
    flexGrow: 1,
  },
  orgLabel: {
    display: "flex",
    alignItems: "flex-start",
    gap: tokens.spacingHorizontalXS,
    color: tokens.colorNeutralForeground2,
  },
});

/**
 * Renders the device from the URL :serial param.
 * The serial is not validated up front; an unknown serial surfaces as an API error in the device view.
 */
const DeviceRoute = ({ organizationId }: { readonly organizationId: string | undefined }) => {
  const { serial } = useParams<{ serial: string }>();
  const styles = useStyles();

  if (serial === undefined || organizationId === undefined) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={styles.deviceContainer}>
      <Device key={serial} serial={serial} organizationId={organizationId} />
    </div>
  );
};

const App = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const styles = useStyles();

  // Capture tokens from the URL fragment, or restore the session via the HttpOnly session cookie
  const [tokensCaptured, setTokensCaptured] = useState(false);
  useEffect(() => {
    const captured = captureTokensFromCallback();
    if (captured) {
      setTokensCaptured(true);
      return;
    }

    restoreSession().then(() => {
      setTokensCaptured(true);
    });
  }, []);

  // Only initialize session info after tokens have been captured
  const { sessionInfo, isLoading: isLoadingSessionInfo } = useSessionInfo(tokensCaptured);

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [hasDevices, setHasDevices] = useState(false);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);

  // Derive organizations directly from session info
  const orgs: Organization[] = useMemo(() => {
    if (sessionInfo?.organizationInfo === undefined || sessionInfo?.organizationInfo === null) {
      return [];
    }
    return [{ id: sessionInfo.organizationInfo.id, name: sessionInfo.organizationInfo.name }];
  }, [sessionInfo]);

  // Derive the selected organization id from session info
  const organizationId: string | undefined = sessionInfo?.organizationId ?? undefined;

  // Check once per org whether it has any devices; the menu loads devices per resource group.
  useEffect(() => {
    if (organizationId === undefined) {
      return;
    }

    const checkDevices = async () => {
      setIsLoadingDevices(true);
      try {
        setHasDevices(await hasAnyDevices(organizationId));
      } catch {
        setHasDevices(false);
      } finally {
        setIsLoadingDevices(false);
      }
    };

    checkDevices();
  }, [organizationId]);

  const isAuthenticated = tokensCaptured && checkAuth();

  // After authentication, check for a stored return URL and navigate there
  useEffect(() => {
    if (isAuthenticated !== true) {
      return;
    }

    const returnUrl = sessionStorage.getItem(RETURN_URL_KEY);
    if (returnUrl !== null) {
      sessionStorage.removeItem(RETURN_URL_KEY);
      navigate(returnUrl, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleOnSignOut = () => {
    setIsLoggingOut(true);
    signOut();
  };

  const orgName = orgs.length > 0 ? orgs[0].name : undefined;

  const isLoading = isLoadingSessionInfo || isLoggingOut || !tokensCaptured;

  if (isLoading) {
    return null;
  }

  if (isAuthenticated !== true) {
    // The backend redirects failed or cancelled logins to /error; show the start page instead.
    if (location.pathname === "/error") {
      return <Navigate to="/" replace />;
    }

    return (
      <WelcomePage
        organizationId={undefined}
        onConnect={() => {
          sessionStorage.setItem(RETURN_URL_KEY, window.location.pathname);
          login();
        }}
      />
    );
  }

  return (
    <Layout
      header={
        <div className={styles.headerBar}>
          <Button appearance="transparent" onClick={() => navigate("/")}>
            {APP.REFERENCE_TOOL_NAME}
          </Button>
          <div className={styles.headerSpacer} />
          {orgName !== undefined && (
            <div className={styles.orgLabel}>
              <BuildingMultiple20Regular />
              <Text weight="bold" size={400}>
                {orgName}
              </Text>
            </div>
          )}
          <CustomProfileMenu onSignOut={handleOnSignOut} />
        </div>
      }
      navigation={<MainMenu organizationId={organizationId} />}
      content={
        <div className={styles.content}>
          <Routes>
            <Route
              index
              element={
                <WelcomePage
                  organizationId={organizationId}
                  hasDevices={hasDevices}
                  isLoadingDevices={isLoadingDevices}
                />
              }
            />
            <Route
              path="devices/:serial/*"
              element={<DeviceRoute organizationId={organizationId} />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      }
    />
  );
};

export default App;
