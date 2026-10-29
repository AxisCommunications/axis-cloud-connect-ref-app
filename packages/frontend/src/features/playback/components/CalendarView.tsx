/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import { Calendar } from "@fluentui/react-calendar-compat";
import { makeStyles, mergeClasses, tokens } from "@fluentui/react-components";
import { type FC, useCallback, useMemo } from "react";

import { useRecordingContext } from "../context";

const useStyles = makeStyles({
  calendarContainer: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow4,
  },
  disabled: {
    pointerEvents: "none",
    opacity: 0.5,
  },
});
interface CalendarViewProps {
  readonly onDateSelected: () => void;
  readonly disabledCalendar: boolean;
}

/**
 * CalendarView displays an interactive calendar for selecting dates with recordings.
 * Days with recordings are highlighted.
 */
export const CalendarView: FC<CalendarViewProps> = ({ onDateSelected, disabledCalendar }) => {
  const styles = useStyles();
  const { currentMonth, setCurrentMonth, selectedDate, setSelectedDate, recordingsByDate } =
    useRecordingContext();

  const datesWithRecordings = useMemo(() => {
    const dates: Date[] = [];
    for (const [dateKey, recordings] of recordingsByDate) {
      if (recordings.length > 0) {
        const [year, month, day] = dateKey.split("-").map(Number);
        dates.push(new Date(year, month - 1, day));
      }
    }
    return dates;
  }, [recordingsByDate]);

  const onSelectDate = useCallback(
    (date: Date) => {
      setSelectedDate(date);
      onDateSelected();
    },
    [setSelectedDate, onDateSelected],
  );

  const onNavigateDate = useCallback(
    (date: Date, _focusOnNavigatedDay: boolean) => {
      setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    },
    [setCurrentMonth],
  );

  const classes = mergeClasses(styles.calendarContainer, disabledCalendar && styles.disabled);
  return (
    <div className={classes}>
      <Calendar
        value={selectedDate ?? undefined}
        onSelectDate={onSelectDate}
        isMonthPickerVisible={false}
        showGoToToday={false}
        calendarDayProps={{
          navigatedDate: currentMonth,
          onNavigateDate,
          getMarkedDays: () => datesWithRecordings,
        }}
      />
    </div>
  );
};
