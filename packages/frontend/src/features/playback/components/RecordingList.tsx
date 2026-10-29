/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import {
  Badge,
  Button,
  makeStyles,
  Spinner,
  Text,
  Title3,
  tokens,
} from "@fluentui/react-components";
import { Play24Regular, PlayCircle24Regular, Stop24Regular } from "@fluentui/react-icons";
import type { FC } from "react";

import { RECORDINGS } from "@/constants/strings";
import { useRecordingContext } from "../context";
import type { Recording } from "../types";
import { calculateDuration, formatDateDisplay, formatDateKey, formatTime } from "../utils";

const useStyles = makeStyles({
  recordingListHeader: {
    display: "grid",
    gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr 120px",
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground2,
    fontWeight: tokens.fontWeightSemibold,
    borderRadius: tokens.borderRadiusSmall,
  },
  recordingItem: {
    display: "grid",
    gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr 120px",
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingVerticalS,
    alignItems: "center",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  emptyState: {
    padding: "20px",
    textAlign: "center",
    color: tokens.colorNeutralForeground2,
  },
  loadingContainer: {
    padding: "40px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },
});

interface RecordingListProps {
  readonly onPlayRecording: (recording: Recording) => Promise<void>;
  readonly onStopRecording: (recordingId: string) => Promise<void>;
  readonly onPlayAll: (date: Date) => Promise<void>;
}

/**
 * RecordingList displays recordings for the selected date with playback controls.
 * Shows loading state, empty state, and recording details with action buttons.
 */
export const RecordingList: FC<RecordingListProps> = ({
  onPlayRecording,
  onStopRecording,
  onPlayAll,
}) => {
  const styles = useStyles();
  const { isLoading, selectedDate, recordingsByDate, activeRecordingId, isActionLoading } =
    useRecordingContext();

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner size="large" label={RECORDINGS.LOADING_RECORDINGS} />
      </div>
    );
  }

  if (selectedDate === null) {
    return (
      <div className={styles.emptyState}>
        <Text>{RECORDINGS.SELECT_DATE}</Text>
      </div>
    );
  }

  const dateKey = formatDateKey(selectedDate);
  const dayRecordings = recordingsByDate.get(dateKey) ?? [];

  if (dayRecordings.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Text>
          {RECORDINGS.NO_RECORDINGS_FOR} {formatDateDisplay(selectedDate)}
        </Text>
      </div>
    );
  }

  return (
    <>
      <div className={styles.headerRow}>
        <Title3>
          {RECORDINGS.RECORDINGS_FOR} {formatDateDisplay(selectedDate)}
        </Title3>
        <Button
          appearance="primary"
          icon={<PlayCircle24Regular />}
          onClick={() => onPlayAll(selectedDate)}
        >
          {RECORDINGS.PLAY_ALL}
        </Button>
      </div>
      <div className={styles.recordingListHeader}>
        <Text>{RECORDINGS.TABLE_TIME}</Text>
        <Text>{RECORDINGS.TABLE_DURATION}</Text>
        <Text>{RECORDINGS.TABLE_TYPE}</Text>
        <Text>{RECORDINGS.TABLE_RESOLUTION}</Text>
        <Text>{RECORDINGS.TABLE_DISK_ID}</Text>
        <Text>{RECORDINGS.TABLE_ACTION}</Text>
      </div>
      {dayRecordings.map((recording) => {
        const isActive =
          recording.recordingStatus === "recording" || recording.recordingId === activeRecordingId;
        return (
          <div key={recording.recordingId} className={styles.recordingItem}>
            <Text>
              {formatTime(recording.startTimeLocal)} -{" "}
              {isActive ? RECORDINGS.IN_PROGRESS : formatTime(recording.stopTimeLocal)}
            </Text>
            <Text>
              {isActive
                ? RECORDINGS.RECORDING
                : calculateDuration(recording.startTime, recording.stopTime)}
            </Text>
            <Badge
              appearance="tint"
              color={recording.eventId.trim() !== "" ? "danger" : "informative"}
            >
              {recording.eventId.trim() !== ""
                ? recording.eventId.trim()
                : recording.eventTrigger !== ""
                  ? recording.eventTrigger
                  : RECORDINGS.MANUAL}
            </Badge>
            <Text>{recording.video?.resolution ?? RECORDINGS.NOT_AVAILABLE}</Text>
            <Text>{recording.diskId !== "" ? recording.diskId : RECORDINGS.NOT_AVAILABLE}</Text>
            {isActive ? (
              <Button
                size="small"
                icon={<Stop24Regular />}
                appearance="primary"
                onClick={() => onStopRecording(recording.recordingId)}
                disabled={isActionLoading}
              >
                {RECORDINGS.STOP}
              </Button>
            ) : (
              <Button
                size="small"
                icon={<Play24Regular />}
                onClick={() => onPlayRecording(recording)}
              >
                {RECORDINGS.OVERLAY_PLAY}
              </Button>
            )}
          </div>
        );
      })}
    </>
  );
};
