/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import { buildEdgelinkRequest, type CommandConfig, type EdgeLinkRequest } from "@/api";

import type { DeviceInfo } from "../types";

/**
 * Builds an EdgeLinkRequest for preview/send from a command and its parameter values.
 *
 * Uses the command's `buildQueryParams` / `buildBody` functions when available (typed TS commands).
 * Falls back to legacy `${param}` template replacement for backward compatibility.
 */
export const buildRequestPreview = (
  command: CommandConfig,
  params: Record<string, string> = {},
  deviceInfo: DeviceInfo,
): EdgeLinkRequest | null => {
  const queryParams = resolveQueryParams(command, params);
  const { body, contentType } = resolveBody(command, params);

  return buildEdgelinkRequest(deviceInfo.organizationId, deviceInfo.targetId, command.cgi, {
    method: command.method,
    queryParams,
    body,
    contentType,
  });
};

/**
 * Resolves query parameters for GET requests.
 */
const resolveQueryParams = (
  command: CommandConfig,
  params: Record<string, string>,
): Record<string, string> | undefined => {
  if (command.method !== "GET") {
    return undefined;
  }

  if (command.buildQueryParams !== undefined) {
    return command.buildQueryParams(params);
  }

  // Legacy fallback: resolve ${param} templates in static queryParams
  if (command.queryParams === undefined) {
    return undefined;
  }

  const resolved: Record<string, string> = {};
  for (const [key, value] of Object.entries(command.queryParams)) {
    resolved[key] = resolveTemplateValue(value, params);
  }

  // Add any user params not covered by a template
  for (const [key, value] of Object.entries(params)) {
    const isUsedInTemplate = Object.values(command.queryParams).some((v) => v === `\${${key}}`);
    if (!isUsedInTemplate) {
      resolved[key] = value;
    }
  }

  return resolved;
};

/**
 * Resolves the request body for POST requests.
 */
const resolveBody = (
  command: CommandConfig,
  params: Record<string, string>,
): { body?: unknown; contentType?: string } => {
  if (command.method !== "POST" || command.requestBody === undefined) {
    return { contentType: command.contentType };
  }

  // Use typed buildBody when available
  if (command.buildBody !== undefined) {
    return {
      body: command.buildBody(params),
      contentType: command.contentType,
    };
  }

  // Legacy fallback: template replacement in requestBody
  const contentType = command.contentType;

  if (contentType === "raw") {
    const formData = new URLSearchParams();
    for (const [key, value] of Object.entries(command.requestBody)) {
      formData.append(key, resolveTemplateValue(value as string, params));
    }
    return {
      body: formData.toString(),
      contentType: "application/x-www-form-urlencoded",
    };
  }

  const jsonBody = structuredClone(command.requestBody) as Record<string, unknown>;
  replaceTemplatePlaceholders(jsonBody, params, command);
  return { body: jsonBody, contentType };
};

/** Matches ${paramName} template placeholders in command configuration strings. */
const TEMPLATE_PLACEHOLDER = /\${(\w+)}/g;

/**
 * Resolves a single template value (e.g. "${resolution}") to the corresponding
 * parameter value, or returns the original string if not a template.
 */
const resolveTemplateValue = (value: string, params: Record<string, string>): string => {
  if (typeof value === "string" && value.startsWith("${")) {
    const paramName = value.slice(2, -1);
    return params[paramName] ?? "";
  }
  return value;
};

/**
 * Recursively walks an object tree and replaces ${paramName} template strings
 * with the corresponding parameter values.
 */
const replaceTemplatePlaceholders = (
  obj: Record<string, unknown>,
  params: Record<string, string>,
  command: CommandConfig,
): void => {
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      obj[key] = value.replace(TEMPLATE_PLACEHOLDER, (_, paramName: string) => {
        if (params[paramName] === undefined) {
          return "";
        }
        if (command.parameters?.[paramName]?.type === "integer") {
          return String(Number.parseInt(params[paramName], 10));
        }
        return params[paramName];
      });
    } else if (typeof value === "object" && value !== null) {
      replaceTemplatePlaceholders(value as Record<string, unknown>, params, command);
    }
  }
};
