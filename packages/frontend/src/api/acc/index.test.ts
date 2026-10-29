/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hasAnyDevices, listDevicesPage, listResourceGroups } from ".";

vi.mock("../../auth", () => ({
  getToken: vi.fn(() => Promise.resolve("access-token")),
}));

const BASE_URL = "https://acc.example.com/v1";

const listResponse = (items: unknown[], nextCursor?: string): Promise<Response> =>
  Promise.resolve(
    Response.json({ items, pagination: { hasMore: nextCursor !== undefined, nextCursor } }),
  );

const requestedUrl = (callIndex: number): URL => {
  return new URL(String(vi.mocked(fetch).mock.calls[callIndex][0]));
};

describe("ACC API", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_ACC_BASE_URL", BASE_URL);
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("listDevicesPage sends resourceGroupId, cursor and pageSize as query params", async () => {
    vi.mocked(fetch).mockImplementation(() => listResponse([]));

    await listDevicesPage("org 1", { resourceGroupId: "group-1", cursor: "a&b" });

    const url = requestedUrl(0);
    expect(url.pathname).toBe("/v1/organizations/org%201/devices");
    expect(url.searchParams.get("resourceGroupId")).toBe("group-1");
    expect(url.searchParams.get("cursor")).toBe("a&b");
    expect(url.searchParams.get("pageSize")).toBe("50");
  });

  it("listDevicesPage omits optional params when not given", async () => {
    vi.mocked(fetch).mockImplementation(() => listResponse([]));

    await listDevicesPage("org-1");

    const url = requestedUrl(0);
    expect(url.searchParams.has("resourceGroupId")).toBe(false);
    expect(url.searchParams.has("cursor")).toBe(false);
  });

  it("hasAnyDevices requests a single device", async () => {
    vi.mocked(fetch).mockImplementation(() => listResponse([{ id: "device-1" }]));

    await expect(hasAnyDevices("org-1")).resolves.toBe(true);
    expect(requestedUrl(0).searchParams.get("pageSize")).toBe("1");
  });

  it("listResourceGroups follows the cursor until the last page", async () => {
    vi.mocked(fetch)
      .mockImplementationOnce(() => listResponse([{ id: "group-1" }], "next"))
      .mockImplementationOnce(() => listResponse([{ id: "group-2" }]));

    const groups = await listResourceGroups("org-1");

    expect(groups.map((group) => group.id)).toEqual(["group-1", "group-2"]);
    expect(requestedUrl(1).searchParams.get("cursor")).toBe("next");
  });
});
