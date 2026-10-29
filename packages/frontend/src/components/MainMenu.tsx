/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  type AccordionToggleEventHandler,
  Button,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  makeStyles,
  mergeClasses,
  Spinner,
  Text,
  ToolbarButton,
  Tooltip,
  tokens,
} from "@fluentui/react-components";
import {
  DocumentRegular,
  FolderRegular,
  MoreHorizontal24Filled,
  VideoRegular,
} from "@fluentui/react-icons";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { APP, MAIN_MENU } from "@/constants/strings";
import type { Device } from "../api/acc/types";
import { type GroupDevicesState, useResourceGroupDevices } from "../hooks/useResourceGroupDevices";
import { DisplayError } from "./DisplayError";

const useStyles = makeStyles({
  container: {
    display: "flex",
    height: "100%",
  },
  iconMenu: {
    display: "flex",
    flexDirection: "column",
    backgroundColor: tokens.colorNeutralBackground1,
    height: "100%",
    width: "48px",
    borderRight: `1px solid ${tokens.colorNeutralStroke1}`,
    padding: `${tokens.spacingVerticalM} 0`,
  },
  button: {
    width: "100%",
    margin: `${tokens.spacingVerticalXS} 0`,
    padding: `${tokens.spacingVerticalS} 0`,
  },
  selectedButton: {
    backgroundColor: tokens.colorNeutralBackground3,
  },
  treeContainer: {
    display: "flex",
    flexDirection: "column",
    backgroundColor: tokens.colorNeutralBackground2,
    height: "100%",
    width: "320px",
    borderRight: `1px solid ${tokens.colorNeutralStroke1}`,
    padding: tokens.spacingVerticalM,
    overflowY: "auto",
  },
  treeHeader: {
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    margin: `0 0 ${tokens.spacingVerticalS} 0`,
    fontWeight: tokens.fontWeightSemibold,
  },
  spinnerContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },
  noDevices: {
    padding: tokens.spacingVerticalM,
    color: tokens.colorNeutralForeground2,
    textAlign: "center",
  },
  treeItem: {
    display: "grid",
    alignItems: "center",
    gridTemplateColumns: "1fr auto",
    gap: tokens.spacingHorizontalM,
    width: "100%",
  },
  subtitle: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  deviceInfo: {
    display: "flex",
    flexDirection: "column",
  },
  selectedDeviceItem: {
    backgroundColor: tokens.colorNeutralBackground4,
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground4Hover,
    },
  },
  deviceItemRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: tokens.spacingVerticalS,
    cursor: "pointer",
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground3,
    },
  },
  deviceItemButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    width: "100%",
    textAlign: "left",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
  },
  deviceItemContent: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
  },
  docsButtonsWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  panelStatus: {
    display: "flex",
    justifyContent: "center",
    padding: tokens.spacingVerticalS,
  },
});

interface MainMenuProps {
  readonly organizationId?: string;
}

export const MainMenu = ({ organizationId }: MainMenuProps) => {
  const navigate = useNavigate();
  const { serial: selectedSerial } = useParams<{ serial: string }>();
  const styles = useStyles();
  const [selectedItem, setSelectedItem] = useState<string>(MAIN_MENU.DEVICES_ID);
  const { resourceGroups, isLoadingGroups, groupsError, devicesByGroup, loadDevices } =
    useResourceGroupDevices(organizationId);

  const sortedResourceGroups = useMemo(
    () => [...resourceGroups].sort((a, b) => a.name.localeCompare(b.name)),
    [resourceGroups],
  );

  const handleSelect = (itemId: string) => {
    setSelectedItem(itemId);
  };

  const handleToggleGroup: AccordionToggleEventHandler<string> = (_event, data) => {
    const isOpening = data.openItems.includes(data.value);
    if (isOpening && devicesByGroup[data.value] === undefined) {
      loadDevices(data.value);
    }
  };
  const handleOpenDeviceInterface = (device: Device) => {
    if (organizationId === undefined) {
      return;
    }

    const url = new URL(import.meta.env.VITE_ADA_BASE_URL);
    url.searchParams.set("organization", organizationId);
    url.searchParams.set("target", device.serial);
    window.open(url.toString(), "_blank");
  };

  const renderDeviceItem = (device: Device) => (
    <div
      key={device.id}
      className={mergeClasses(
        styles.treeItem,
        selectedSerial === device.serial ? styles.selectedDeviceItem : styles.deviceItemRow,
      )}
    >
      <button
        type="button"
        onClick={() => navigate(`/devices/${device.serial}/live-view`)}
        className={styles.deviceItemButton}
      >
        <div className={styles.deviceItemContent}>
          <VideoRegular />
          <div className={styles.deviceInfo}>
            <span>{device.serial}</span>
            <Text className={styles.subtitle}>{device.name}</Text>
          </div>
        </div>
      </button>
      <Menu>
        <MenuTrigger>
          <ToolbarButton onClick={(e) => e.stopPropagation()} icon={<MoreHorizontal24Filled />} />
        </MenuTrigger>
        <MenuPopover>
          <MenuList>
            <MenuItem onClick={() => handleOpenDeviceInterface(device)}>
              {MAIN_MENU.OPEN_DEVICE_INTERFACE}
            </MenuItem>
          </MenuList>
        </MenuPopover>
      </Menu>
    </div>
  );

  // The count is only known once every page of the group has been loaded.
  const renderGroupCount = (group: GroupDevicesState | undefined) => {
    if (
      group === undefined ||
      group.isLoading ||
      group.error !== "" ||
      group.nextCursor !== undefined
    ) {
      return null;
    }

    return (
      <Text className={styles.subtitle} block>
        {group.devices.length}{" "}
        {group.devices.length === 1
          ? MAIN_MENU.DEVICES_COUNT_SUFFIX.slice(0, -1) // Remove 's' for singular
          : MAIN_MENU.DEVICES_COUNT_SUFFIX}
      </Text>
    );
  };

  const renderGroupDevices = (resourceGroupId: string) => {
    const group = devicesByGroup[resourceGroupId];
    if (group === undefined) {
      return null;
    }

    const isEmpty =
      !group.isLoading &&
      group.error === "" &&
      group.devices.length === 0 &&
      group.nextCursor === undefined;
    const canLoadMore = !group.isLoading && (group.nextCursor !== undefined || group.error !== "");

    return (
      <>
        {group.devices.map(renderDeviceItem)}
        {isEmpty && <Text className={styles.noDevices}>{MAIN_MENU.NO_DEVICES_IN_GROUP}</Text>}
        {group.error !== "" && <DisplayError error={group.error} />}
        {group.isLoading && (
          <div className={styles.panelStatus}>
            <Spinner size="tiny" />
          </div>
        )}
        {canLoadMore && (
          <div className={styles.panelStatus}>
            <Button appearance="subtle" onClick={() => loadDevices(resourceGroupId)}>
              {group.error !== "" ? MAIN_MENU.RETRY : MAIN_MENU.LOAD_MORE}
            </Button>
          </div>
        )}
      </>
    );
  };

  const renderDeviceTree = () => {
    if (isLoadingGroups) {
      return (
        <div className={styles.spinnerContainer}>
          <Spinner size="medium" />
        </div>
      );
    }

    if (groupsError !== "") {
      return <DisplayError error={groupsError} />;
    }

    if (sortedResourceGroups.length === 0) {
      return <Text className={styles.noDevices}>{MAIN_MENU.NO_DEVICES_FOUND}</Text>;
    }

    return (
      <Accordion collapsible onToggle={handleToggleGroup}>
        {sortedResourceGroups.map((resourceGroup) => (
          <AccordionItem key={resourceGroup.id} value={resourceGroup.id}>
            <AccordionHeader icon={<FolderRegular />}>
              <div>
                {resourceGroup.name}
                {renderGroupCount(devicesByGroup[resourceGroup.id])}
              </div>
            </AccordionHeader>
            <AccordionPanel>{renderGroupDevices(resourceGroup.id)}</AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>
    );
  };

  const openDocumentation = (url: string) => {
    window.open(url, "_blank");
  };

  return (
    <div className={styles.container}>
      <div className={styles.iconMenu}>
        <Tooltip content={MAIN_MENU.DEVICES_LABEL} relationship="label">
          <Button
            className={mergeClasses(
              styles.button,
              selectedItem === MAIN_MENU.DEVICES_ID && styles.selectedButton,
            )}
            icon={<VideoRegular />}
            appearance="subtle"
            onClick={() => handleSelect(MAIN_MENU.DEVICES_ID)}
          />
        </Tooltip>
        <Tooltip content={MAIN_MENU.DOCUMENTATION_LABEL} relationship="label">
          <Button
            className={mergeClasses(
              styles.button,
              selectedItem === MAIN_MENU.DOCUMENTATION_ID && styles.selectedButton,
            )}
            icon={<DocumentRegular />}
            appearance="subtle"
            onClick={() => handleSelect(MAIN_MENU.DOCUMENTATION_ID)}
          />
        </Tooltip>
      </div>
      {selectedItem === MAIN_MENU.DEVICES_ID && (
        <div className={styles.treeContainer}>
          <div className={styles.treeHeader}>{MAIN_MENU.DEVICES_LABEL}</div>
          {renderDeviceTree()}
        </div>
      )}
      {selectedItem === MAIN_MENU.DOCUMENTATION_ID && (
        <div className={styles.treeContainer}>
          <div className={styles.treeHeader}>{MAIN_MENU.DOCUMENTATION_LABEL}</div>
          <div className={styles.docsButtonsWrapper}>
            <Button
              appearance="secondary"
              onClick={() => openDocumentation(MAIN_MENU.VAPIX_DOC_URL)}
            >
              {MAIN_MENU.VAPIX_DOC_LABEL}
            </Button>

            <Button appearance="secondary" onClick={() => openDocumentation(APP.LEARN_MORE_URL)}>
              {APP.LEARN_MORE_TEXT}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
