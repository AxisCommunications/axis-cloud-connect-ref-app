/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

const APP_NAME = "Axis Reference App for Cloud Connect";

export const APP = {
  REFERENCE_TOOL_NAME: APP_NAME,
  LEARN_MORE_TEXT: "Axis Developer",
  LEARN_MORE_URL: "https://developer.connect.axis.com/",
  SIGN_OUT: "Sign out",
};

export const COMMON = {
  ERROR_TITLE: "Error",
};

export const LIVE_VIEW = {
  TITLE: "Live view",
  DESCRIPTION:
    "Stream live video from your Axis cameras in real-time with WebRTC technology and control PTZ cameras.",
  HEADER: "Live view - real-time video streaming",
  COLLAPSED_HELP: "Click to expand info",
  COLLAPSE_ARIA_LABEL: "Collapse live view information",
};

export const REMOTE_OPERATIONS = {
  TITLE: "Remote operations",
  DESCRIPTION:
    "Execute VAPIX API commands to configure and control your devices remotely. Access pre-defined commands or create custom operations for advanced device management.",
  HEADER: "Remote operations - EdgeLink VAPIX commands",
  COLLAPSED_HELP: "Click to expand info",
  EXPAND_ARIA_LABEL: "Expand remote operations information",
  COLLAPSE_ARIA_LABEL: "Collapse remote operations information",
  PREDEFINED_COMMANDS: "Pre-defined commands",
  CUSTOM_GROUP: "Custom",
  CUSTOM_OPERATION: "Custom operation",
  COMMAND_PARAMETERS: "Command parameters",
  PREVIEW_REQUEST: "Preview request",
  HIDE_PREVIEW: "Hide preview",
  SEND_REQUEST: "Send request",
  REQUEST_PREVIEW: "Request preview",
  RESPONSE: "Response",
};

export const RECORDINGS = {
  TITLE: "Recordings",
  DESCRIPTION:
    "Browse and playback recorded video footage from the SD card on the device. Manage recording sessions, and access your video archive with ease.",
  HEADER: "Recordings - video playback and recording management",
  COLLAPSED_HELP: "Click to expand info",
  COLLAPSE_ARIA_LABEL: "Collapse recordings information",
  CALENDAR: "Calendar",
  REFRESH: "Refresh",
  CONTINUOUS_RECORDING: "Record on SD card",
  START: "Start",
  STOP: "Stop",
  LOADING_RECORDINGS: "Loading recordings...",
  SELECT_DATE: "Select a date to view recordings",
  NO_RECORDINGS_FOR: "No recordings found for",
  RECORDINGS_FOR: "Recordings for",
  PLAY_ALL: "Play all",
  TABLE_TIME: "Time",
  TABLE_DURATION: "Duration",
  TABLE_TYPE: "Type",
  TABLE_RESOLUTION: "Resolution",
  TABLE_DISK_ID: "Disk ID",
  TABLE_ACTION: "Action",
  IN_PROGRESS: "In Progress",
  RECORDING: "Recording...",
  MANUAL: "Manual",
  NOT_AVAILABLE: "N/A",
  OVERLAY_PLAY_ALL_MODE: "Play All Mode",
  OVERLAY_SINGLE_MODE: "Single Recording Playback",
  OVERLAY_CLOSE: "Close",
  OVERLAY_PAUSE: "Pause",
  OVERLAY_PLAY: "Play",
};

export const LIST_DEVICES = {
  WELCOME_TITLE: APP_NAME,
  WELCOME_SUBTITLE: "Select a device from the side navigation menu to get started.",
  NO_DEVICES_FOUND: "No devices found",
  NO_DEVICES_IN_ORG: "There are no devices in this organization.",
  ONBOARDING_PREFIX: "To get started, onboard and connect your Axis devices using ",
  ONBOARDING_LINK_TEXT: "My Systems",
  ONBOARDING_URL: "https://mysystems.axis.com",
};

export const MAIN_MENU = {
  DEVICES_ID: "devices",
  DOCUMENTATION_ID: "documentation",
  DEVICES_LABEL: "Devices",
  DOCUMENTATION_LABEL: "Documentation",
  NO_DEVICES_FOUND: "No devices found",
  NO_DEVICES_IN_GROUP: "No devices in this group",
  LOAD_MORE: "Load more",
  RETRY: "Retry",
  DEVICES_COUNT_SUFFIX: "devices",
  OPEN_DEVICE_INTERFACE: "Open device interface",
  VAPIX_DOC_LABEL: "Axis VAPIX API",
  VAPIX_DOC_URL: "https://developer.axis.com/vapix/",
};

export const EDGELINK = {
  REQUEST_DETAILS: "Request details",
  ENDPOINT_PATH: "Endpoint path",
  METHOD: "Method",
  CONTENT_TYPE: "Content-Type",
  BEARER_TOKEN: "Bearer Token",
  BEARER_TOKEN_WARNING:
    "Shown for learning purposes. This is a live credential for your organization, also included in copied cURL commands. Do not share it.",
  REQUEST_BODY: "Request Body",
  SELECT_OPTION: "Select an option",
  HIGHLIGHT_ORG_ID: "Organization ID",
  HIGHLIGHT_DEVICE_MAC: "Device MAC Address",
  HIGHLIGHT_VAPIX: "VAPIX API",
  SHOW_RAW: "Show Raw",
  BEAUTIFY: "Beautify",
  COPY_TO_CLIPBOARD: "Copy to clipboard",
  COPY_AS_CURL: "Copy as cURL command",
  REQUEST_TEMPLATE: "Request template",
};

export const WELCOME_PAGE = {
  TITLE: `Welcome to ${APP_NAME}`,
  SIGN_IN: "Sign in with My Axis account to get started.",
  CONNECT_BUTTON: "Sign in",
  CONNECTING_BUTTON: "Signing in...",
  DESCRIPTION:
    "This reference application demonstrates how to integrate with Axis Cloud Connect to securely access and control Axis devices over the cloud, covering OAuth 2.0 authentication, REST API communication, and real-time video streaming. Use it as a starting point to explore the integration patterns and build your own cloud-connected video applications.",
};
