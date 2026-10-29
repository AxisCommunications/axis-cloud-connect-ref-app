/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import { describe, expect, it } from "vitest";

import { formatDateKey, getDefaultSelectedDate } from "./date-utils";

describe("getDefaultSelectedDate", () => {
  const today = new Date(2026, 9, 29, 12);
  const todayKey = formatDateKey(today);

  it("selects today when recordings exist for the local date", () => {
    const recordingsByDate = new Map([[todayKey, [{}]]]);

    expect(getDefaultSelectedDate(null, recordingsByDate, today)).toBe(today);
  });

  it("leaves the date unselected when there are no recordings today", () => {
    const recordingsByDate = new Map([["2026-10-28", [{}]]]);

    expect(getDefaultSelectedDate(null, recordingsByDate, today)).toBeNull();
  });

  it("preserves an existing date selection", () => {
    const selectedDate = new Date(2026, 9, 28, 12);
    const recordingsByDate = new Map([[todayKey, [{}]]]);

    expect(getDefaultSelectedDate(selectedDate, recordingsByDate, today)).toBe(selectedDate);
  });
});
