/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import { useState } from "react";

import {
  buildEdgelinkVapixUrl,
  type CommandConfig,
  type EdgeLinkRequest,
  sendEdgelinkRequest,
} from "@/api";
import { getToken } from "@/auth";
import { REMOTE_OPERATIONS } from "@/constants/strings";
import type { RequestData, RequestResponse } from "../types";
import { buildRequestPreview, deviceInfoUtils, ValidationError } from "../utils";
import { useCommandSelection } from "./useCommandSelection";

export const SELF_DEFINED_COMMAND = "self-defined";

export const useEdgelinkOperationsData = (organizationId: string, targetId: string) => {
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Request fields (inlined from useRequestFields)
  const [cgi, setCgi] = useState("");
  const [method, setMethod] = useState<"GET" | "POST">("GET");
  const [body, setBody] = useState("");
  const [contentType, setContentType] = useState("application/json");

  // Preview/response state (inlined from useRequestPreview)
  const [previewResponse, setPreviewResponse] = useState<string>("");
  const [requestData, setRequestData] = useState<RequestData | undefined>(undefined);
  const [requestResponse, setRequestResponse] = useState<string>("");
  const [bearerToken, setBearerToken] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);

  const commandSelection = useCommandSelection();

  const deviceInfo = deviceInfoUtils.getDeviceInfo(organizationId, targetId);

  const selectedCommandName =
    commandSelection.selectedCommand === SELF_DEFINED_COMMAND
      ? REMOTE_OPERATIONS.CUSTOM_OPERATION
      : commandSelection.selectedCommandName;

  // For pre-defined POST commands the body is read-only, so show the resolved body
  // (Command Parameters applied) rather than the static template example.
  const resolveDisplayBody = (): string => {
    if (commandSelection.selectedCommand === SELF_DEFINED_COMMAND) {
      return body;
    }

    const command = commandSelection.commandConfig;
    if (command === undefined || command.method !== "POST") {
      return body;
    }

    const request = buildRequestPreview(command, commandSelection.commandParameters, deviceInfo);
    if (request === null || request.body === undefined) {
      return "";
    }

    if (typeof request.body !== "string") {
      return JSON.stringify(request.body, null, 2);
    }

    try {
      return JSON.stringify(JSON.parse(request.body), null, 2);
    } catch {
      return request.body;
    }
  };

  const displayBody = resolveDisplayBody();

  const setFieldsFromCommand = (command: CommandConfig) => {
    setCgi(command.cgi);
    setMethod(command.method);
    setContentType(command.contentType ?? "application/json");
    setBody(command.requestBody !== undefined ? JSON.stringify(command.requestBody, null, 2) : "");
  };

  const resetFields = () => {
    setCgi("");
    setMethod("GET");
    setBody("");
    setContentType("application/json");
  };

  const handleCommandChange = (commandId: string) => {
    if (commandId === "") {
      commandSelection.selectCommand("");
      resetFields();
      return;
    }

    commandSelection.selectCommand(commandId);

    if (commandId === SELF_DEFINED_COMMAND) {
      resetFields();
      return;
    }

    const command = commandSelection.commands[commandId];
    if (command !== undefined) {
      setFieldsFromCommand(command);
    }
  };

  const buildSelfDefinedRequest = (): EdgeLinkRequest => ({
    url: buildEdgelinkVapixUrl(deviceInfo.organizationId, deviceInfo.targetId, cgi).toString(),
    method,
    headers: {
      "Content-Type": contentType,
    },
    ...(method === "POST" &&
      body !== "" && {
        body,
      }),
  });

  const handlePreviewClick = async () => {
    if (showPreview) {
      setShowPreview(false);
      return;
    }

    setGlobalError(null);

    const token = await getToken();
    setBearerToken(`Bearer ${token}`);

    if (commandSelection.selectedCommand === SELF_DEFINED_COMMAND) {
      const preview = buildSelfDefinedRequest() as RequestData;
      preview.headers.Authorization = `Bearer ${token}`;
      setPreviewResponse(JSON.stringify(preview, null, 2));
      setRequestData(preview);
      setShowPreview(true);
      return;
    }

    const command = commandSelection.commands[commandSelection.selectedCommand];
    const request = buildRequestPreview(command, commandSelection.commandParameters, deviceInfo);

    if (request !== null) {
      const preview = request as RequestData;
      preview.headers.Authorization = `Bearer ${token}`;
      setPreviewResponse(JSON.stringify(preview, null, 2));
      setRequestData(preview);
      setShowPreview(true);
    }
  };

  const handleSendRequest = async () => {
    setGlobalError(null);
    try {
      const token = await getToken();
      setBearerToken(`Bearer ${token}`);

      let request: EdgeLinkRequest;

      if (commandSelection.selectedCommand === SELF_DEFINED_COMMAND) {
        if (cgi.trim() === "") {
          throw new ValidationError("CGI Path is required");
        }
        request = buildSelfDefinedRequest();
      } else {
        const command = commandSelection.commands[commandSelection.selectedCommand];
        const builtRequest = buildRequestPreview(
          command,
          commandSelection.commandParameters,
          deviceInfo,
        );
        if (builtRequest === null) {
          throw new ValidationError("Failed to build request");
        }
        request = builtRequest;
      }

      const response = await sendEdgelinkRequest(request);
      const responseText = await response.text();

      const responseObj: RequestResponse = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers),
        body: responseText,
      };
      setRequestResponse(JSON.stringify(responseObj, null, 2));
    } catch (error) {
      if (error instanceof ValidationError) {
        setGlobalError(error.message);
      } else {
        setGlobalError(
          `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  };

  return {
    selectedCommand: commandSelection.selectedCommand,
    commandParameters: commandSelection.commandParameters,
    errors: commandSelection.errors,
    hasInvalidParameters: commandSelection.hasInvalidParameters,
    categories: commandSelection.categories,
    selectedCommandName,
    commandConfig: commandSelection.commandConfig,
    cgi,
    method,
    body: displayBody,
    contentType,
    globalError,
    previewResponse,
    showPreview,
    bearerToken,
    requestData,
    requestResponse,
    deviceInfo,
    setCgi,
    setMethod,
    setBody,
    setContentType,
    handleCommandChange,
    handleParameterChange: commandSelection.handleParameterChange,
    handlePreviewClick,
    handleSendRequest,
  };
};
