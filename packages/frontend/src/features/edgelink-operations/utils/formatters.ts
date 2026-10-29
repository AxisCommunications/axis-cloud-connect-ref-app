/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

/** Matches adjacent XML closing/opening tags for pretty-printing. */
const XML_TAG_BOUNDARY = /></g;

/** Matches literal escaped newline sequences (\n) in JSON strings. */
const ESCAPED_NEWLINE = /\\n/g;

/** Matches all line-break variants for minification. */
const ALL_LINE_BREAKS = /(\r\n|\n|\r)/gm;

/** Type guard: narrows `unknown` to a non-null object with string keys. */
const isNonNullObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

interface FormatOptions {
  indent?: number;
  beautify?: boolean;
}

const formatters = {
  /**
   * Pretty-prints a JSON value (object or string).
   * When given an object, serialises it directly — avoiding a redundant parse/stringify round-trip.
   */
  json: (value: string | Record<string, unknown>, options: FormatOptions = {}): string => {
    const beautify = options.beautify ?? true;
    try {
      const parsed = typeof value === "string" ? JSON.parse(value) : value;
      return JSON.stringify(parsed, null, beautify ? (options.indent ?? 2) : undefined);
    } catch {
      return typeof value === "string" ? value : JSON.stringify(value);
    }
  },

  xml: (text: string, options: FormatOptions = {}): string => {
    const beautify = options.beautify ?? true;
    try {
      if (typeof text !== "string" || (!text.trim().startsWith("<") && !text.includes("<?xml"))) {
        return text;
      }

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, "text/xml");

      const parseError = xmlDoc.querySelector("parsererror");
      if (parseError !== null) {
        return text;
      }

      const serializer = new XMLSerializer();
      const serializedXml = serializer.serializeToString(xmlDoc);

      if (beautify) {
        return serializedXml
          .replace(XML_TAG_BOUNDARY, ">\n<")
          .split("\n")
          .map((line) => line.trim())
          .join("\n");
      }
      return text;
    } catch {
      return text;
    }
  },
};

/**
 * Unwraps nested response bodies where the backend wraps the actual content
 * in an extra layer: { status, statusText, headers, body: { body: "actual content" } }
 */
const unwrapNestedBody = (parsed: Record<string, unknown>): Record<string, unknown> | null => {
  if (isNonNullObject(parsed.body) && "body" in parsed.body) {
    return {
      status: parsed.status,
      statusText: parsed.statusText,
      headers: parsed.headers,
      body: parsed.body.body,
    };
  }
  return null;
};

/**
 * Unwraps a string body that is itself JSON or XML, for display inside a parent response object.
 */
const parseBodyContent = (body: string): unknown => {
  try {
    return JSON.parse(body);
  } catch {
    if (body.trim().startsWith("<?xml") || body.trim().startsWith("<")) {
      return formatters.xml(body);
    }
    return body;
  }
};

/** Applies the appropriate text formatter based on the response format. */
const formatText = (
  text: string | Record<string, unknown>,
  format: "json" | "xml",
  isBeautified: boolean,
): string => {
  if (format === "json") {
    return formatters.json(text, { beautify: isBeautified }).replace(ESCAPED_NEWLINE, "\n");
  }
  if (format === "xml" && typeof text === "string") {
    return formatters.xml(text, { beautify: isBeautified });
  }
  if (typeof text !== "string") {
    return JSON.stringify(text);
  }
  if (!isBeautified) {
    return text.replace(ALL_LINE_BREAKS, "");
  }
  return text.replace(ESCAPED_NEWLINE, "\n");
};

/**
 * Formats an API response string for display.
 * Pipeline: parse → unwrap nested body → expand string body → format.
 */
export const formatApiResponse = (
  response: string,
  format: "json" | "xml",
  isBeautified: boolean,
): string => {
  try {
    const parsed = JSON.parse(response) as Record<string, unknown>;

    const unwrapped = unwrapNestedBody(parsed);
    if (unwrapped !== null) {
      return formatText(unwrapped, format, isBeautified);
    }

    if (typeof parsed.body === "string") {
      // Expand string bodies (nested JSON / XML) before formatting
      parsed.body = parseBodyContent(parsed.body);
    }

    return formatText(parsed, format, isBeautified);
  } catch {
    return formatText(response, format, isBeautified);
  }
};
