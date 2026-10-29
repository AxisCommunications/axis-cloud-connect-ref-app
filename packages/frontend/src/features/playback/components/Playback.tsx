/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import {
  Button,
  Card,
  makeStyles,
  mergeClasses,
  Popover,
  PopoverSurface,
  PopoverTrigger,
  Text,
  tokens,
} from "@fluentui/react-components";
import { CalendarMonth24Regular } from "@fluentui/react-icons";
import { type FC, useCallback, useEffect, useRef, useState } from "react";
import { InfoBox } from "@/components";
import { RECORDINGS } from "@/constants/strings";
import { RecordingProvider, useRecordingContext } from "../context";
import { usePlayback, useRecordingData, useTimebar } from "../hooks";
import type { Timebar } from "../utils/Timebar";
import { CalendarView, PlaybackControls, RecordingList, VideoPlayerOverlay } from "./";

const useStyles = makeStyles({
  mainContainer: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalL,
    padding: tokens.spacingVerticalL,
    maxWidth: "900px",
    width: "100%",
  },
  container: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalL,
    height: "100%",
    backgroundColor: tokens.colorNeutralBackground2,
    padding: tokens.spacingHorizontalL,
  },
  header: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: tokens.spacingHorizontalS,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow4,
  },
  headerActions: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  errorCard: {
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    backgroundColor: tokens.colorPaletteRedBackground1,
  },
  errorText: {
    color: tokens.colorPaletteRedForeground1,
  },
  successCard: {
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    backgroundColor: tokens.colorPaletteGreenBackground1,
  },
  successText: {
    color: tokens.colorPaletteGreenForeground1,
  },
  statusArea: {
    visibility: "hidden",
  },
  statusAreaVisible: {
    visibility: "visible",
  },
  contentGrid: {
    display: "grid",
    gap: tokens.spacingHorizontalL,
    flexGrow: 1,
    overflowY: "hidden",
  },
  contentGridNoCalendar: {
    gridTemplateColumns: "1fr",
  },
});

interface PlaybackProps {
  readonly serial: string;
  readonly organizationId: string;
}

/**
 * Inner component that uses the context and hooks
 */
const PlaybackContent: FC = () => {
  const styles = useStyles();
  const { error, actionMessage } = useRecordingContext();
  const {
    loadRecordingsData,
    handleStartRecording,
    handleStopRecording,
    handleStopRecordingFromList,
  } = useRecordingData();

  const { setPlayAllMode, setPlayAllRecordings } = useRecordingContext();

  // Refs for video player and timeline
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const videoElementRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLInputElement>(null);
  const playPauseBtnRef = useRef<HTMLButtonElement>(null);
  const timebarRef = useRef<HTMLDivElement>(null);
  const timebarInstanceRef = useRef<Timebar | null>(null);

  // Custom hooks for playback management
  const {
    playRecording,
    closeVideo,
    handleProgressBarMouseDown,
    handleProgressBarMouseUp,
    handleSeek,
    handlePlayPause,
  } = usePlayback(
    videoElementRef,
    videoContainerRef,
    progressBarRef,
    timebarInstanceRef,
    timebarRef,
  );

  const { timebarInstance, handlePlayAll } = useTimebar(timebarRef, playRecording);

  // Sync timebar instance with ref
  useEffect(() => {
    if (timebarInstance.current) {
      timebarInstanceRef.current = timebarInstance.current;
    }
  }, [timebarInstance]);

  // Wrapper for handlePlayAll that provides context setters
  const handlePlayAllWithContext = async (date: Date) => {
    await handlePlayAll(date, videoContainerRef, setPlayAllMode, setPlayAllRecordings);
  };

  const messageCardClassName = mergeClasses(
    styles.statusArea,
    error !== null ? styles.errorCard : undefined,
    error !== null ? styles.statusAreaVisible : undefined,
    actionMessage !== null && error === null ? styles.successCard : undefined,
    actionMessage !== null && error === null ? styles.statusAreaVisible : undefined,
  );

  const [calendarOpen, setCalendarOpen] = useState(false);
  const closeCalendar = useCallback(() => setCalendarOpen(false), []);

  return (
    <div className={styles.mainContainer}>
      <InfoBox
        title={RECORDINGS.TITLE}
        header={RECORDINGS.HEADER}
        collapsedHelp={RECORDINGS.COLLAPSED_HELP}
        collapseAriaLabel={RECORDINGS.COLLAPSE_ARIA_LABEL}
      >
        <Text as="p">{RECORDINGS.DESCRIPTION}</Text>
      </InfoBox>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <PlaybackControls
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            disableControls={error !== null}
          />
          <div className={styles.headerActions}>
            <Popover
              positioning="before"
              open={calendarOpen}
              onOpenChange={(_e, data) => setCalendarOpen(data.open)}
              withArrow
            >
              <PopoverTrigger disableButtonEnhancement>
                <Button appearance="primary" icon={<CalendarMonth24Regular />} size="small">
                  {RECORDINGS.CALENDAR}
                </Button>
              </PopoverTrigger>
              <PopoverSurface>
                <CalendarView onDateSelected={closeCalendar} disabledCalendar={error !== null} />
              </PopoverSurface>
            </Popover>
            <Button size="small" onClick={loadRecordingsData}>
              {RECORDINGS.REFRESH}
            </Button>
          </div>
        </div>

        {/* Status Messages */}
        <Card appearance="filled-alternative" className={messageCardClassName}>
          {error !== null && <Text className={styles.errorText}>{error}</Text>}
          {actionMessage !== null && <Text className={styles.successText}>{actionMessage}</Text>}
        </Card>

        {/* Content Grid */}
        <div className={`${styles.contentGrid} ${styles.contentGridNoCalendar}`}>
          <RecordingList
            onPlayRecording={(r) => playRecording(r, false)}
            onStopRecording={handleStopRecordingFromList}
            onPlayAll={handlePlayAllWithContext}
          />
        </div>

        {/* Video Player Overlay */}
        <VideoPlayerOverlay
          videoContainerRef={videoContainerRef}
          videoElementRef={videoElementRef}
          progressBarRef={progressBarRef}
          playPauseBtnRef={playPauseBtnRef}
          timebarRef={timebarRef}
          onClose={closeVideo}
          onPlayPause={handlePlayPause}
          onProgressBarMouseDown={handleProgressBarMouseDown}
          onProgressBarMouseUp={handleProgressBarMouseUp}
          onSeek={handleSeek}
        />
      </div>
    </div>
  );
};

/**
 * Wrapper component that loads recording data
 */
const PlaybackWithData: FC = () => {
  const { loadRecordingsData } = useRecordingData();

  // Load recordings when component mounts
  useEffect(() => {
    void loadRecordingsData();
  }, [loadRecordingsData]);

  return <PlaybackContent />;
};

/**
 * Playback is the main container for the recording and playback feature.
 * It provides a calendar-based interface for viewing, managing, and playing back
 * recordings from Axis devices.
 *
 * Features:
 * - Calendar view with recording indicators
 * - Recording list with metadata display
 * - Manual recording controls (start/stop)
 * - Event-based recording setup
 * - Single recording playback
 * - Play All mode for continuous playback
 * - Interactive timeline with zoom and seek
 */
export const Playback: FC<PlaybackProps> = ({ serial, organizationId }) => {
  return (
    <RecordingProvider serial={serial} organizationId={organizationId}>
      <PlaybackWithData />
    </RecordingProvider>
  );
};
