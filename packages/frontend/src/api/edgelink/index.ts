/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import { getToken } from "../../auth";

const EDGELINK_BASE_URL = import.meta.env.VITE_EDGELINK_BASE_URL;

export interface VapixRequestOptions {
  readonly method?: "GET" | "POST";
  readonly contentType?: string;
  readonly body?: unknown;
}

/**
 * Constructs the EdgeLink VAPIX URL for both display and actual requests.
 */
export const buildEdgelinkVapixUrl = (
  organizationId: string,
  targetId: string,
  cgi: string,
): URL => {
  return new URL(
    `${EDGELINK_BASE_URL}/organizations/${encodeURIComponent(organizationId)}/targets/${encodeURIComponent(targetId)}/${cgi}`,
  );
};

/**
 * Sends a VAPIX request directly to EdgeLink with the access token.
 */
export const proxyVapixRequest = async (
  organizationId: string,
  targetId: string,
  cgi: string,
  options: VapixRequestOptions = {},
): Promise<Response> => {
  const method = options.method ?? "GET";
  const accessToken = await getToken();
  const url = buildEdgelinkVapixUrl(organizationId, targetId, cgi);

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  };

  if (options.contentType !== undefined) {
    headers["Content-Type"] = options.contentType;
  } else if (method === "POST") {
    headers["Content-Type"] = "application/json";
  }

  let body: string | undefined;
  if (method === "POST" && options.body !== undefined) {
    body = typeof options.body === "string" ? options.body : JSON.stringify(options.body);
  }

  return fetch(url.toString(), { method, headers, body });
};

export interface EdgeLinkRequest {
  readonly url: string;
  readonly method: "GET" | "POST";
  readonly headers: Record<string, string>;
  readonly body?: unknown;
}

/**
 * Builds a display-only EdgeLinkRequest object for request previews.
 * Use `sendEdgelinkRequest` to actually execute it.
 */
export const buildEdgelinkRequest = (
  organizationId: string,
  targetId: string,
  cgi: string,
  options: {
    readonly method: "GET" | "POST";
    readonly queryParams?: Record<string, string>;
    readonly body?: unknown;
    readonly contentType?: string;
  },
): EdgeLinkRequest => {
  const url = buildEdgelinkVapixUrl(organizationId, targetId, cgi);

  if (options.queryParams !== undefined) {
    for (const [key, value] of Object.entries(options.queryParams)) {
      url.searchParams.append(key, value);
    }
  }

  let finalBody = options.body;
  let contentType = options.contentType ?? "application/json";

  if (options.method === "POST") {
    if (contentType === "raw") {
      if (typeof finalBody === "object" && finalBody !== null) {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(finalBody)) {
          params.append(key, value as string);
        }
        finalBody = params.toString();
      }
      contentType = "application/x-www-form-urlencoded";
    } else if (contentType === "application/json") {
      finalBody = typeof finalBody === "string" ? finalBody : JSON.stringify(finalBody);
    }
  }

  return {
    url: url.toString(),
    method: options.method,
    headers: {
      "Content-Type": contentType,
    },
    ...(finalBody !== undefined ? { body: finalBody } : {}),
  };
};

/**
 * Sends a pre-built EdgeLinkRequest directly to EdgeLink.
 */
export const sendEdgelinkRequest = async (request: EdgeLinkRequest): Promise<Response> => {
  const { organizationId, targetId, cgi } = parseEdgelinkUrl(new URL(request.url));
  return proxyVapixRequest(organizationId, targetId, cgi, {
    method: request.method,
    contentType: request.headers["Content-Type"],
    body: request.body,
  });
};

/**
 * Parses an EdgeLink-style URL to extract org, target, and CGI path.
 */
const parseEdgelinkUrl = (
  url: URL,
): {
  organizationId: string;
  targetId: string;
  cgi: string;
} => {
  const pathname = url.pathname;
  const orgMatch = pathname.match(/\/organizations\/([^/]+)\/targets\/([^/]+)\/(.+)/);

  if (orgMatch === null) {
    throw new Error(`Invalid EdgeLink URL format: ${url.toString()}`);
  }

  let cgi = orgMatch[3];
  if (url.search !== "") {
    cgi += url.search;
  }

  return {
    organizationId: decodeURIComponent(orgMatch[1]),
    targetId: decodeURIComponent(orgMatch[2]),
    cgi,
  };
};

export * from "./commands";
export * from "./types";
