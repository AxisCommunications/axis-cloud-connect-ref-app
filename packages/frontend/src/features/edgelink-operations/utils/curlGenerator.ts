/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import type { RequestData } from "../types";

/** Matches single quotes for shell escaping in cURL commands. */
const SINGLE_QUOTE = /'/g;

/** Wraps a value in single quotes so a POSIX shell treats it as one literal argument. */
const shellQuote = (value: string): string => `'${value.replace(SINGLE_QUOTE, "'\\''")}'`;

/** Attempts to parse a JSON string. Returns the original string if parsing fails. */
const tryParseJson = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

/**
 * Serializes the request body into curl `-d` flag format.
 */
const serializeCurlBody = (request: RequestData): string => {
  if (request.body === undefined) {
    return "";
  }

  const body = typeof request.body === "string" ? tryParseJson(request.body) : request.body;

  const jsonString = typeof body === "string" ? body : JSON.stringify(body, null, 2);
  return `-d ${shellQuote(jsonString)}`;
};

export const generateCurlCommand = (request: RequestData): string => {
  const headers = Object.entries(request.headers)
    .map(([key, value]) => `-H ${shellQuote(`${key}: ${value}`)}`)
    .join(" \\\n  ");

  const bodyPart = serializeCurlBody(request);

  const parts = [`curl -X ${request.method}`, headers];
  if (bodyPart !== "") {
    parts.push(bodyPart);
  }
  parts.push(shellQuote(request.url));

  return parts.join(" \\\n  ");
};
