/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import type {
  EdgeRecordingDetails,
  PlaybackContext,
} from "@axis-communications/axis-web-video-player";
import {
  createContext,
  type Dispatch,
  type FC,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { Recording } from "../types";

/**
 * Shared state for the recording and playback feature
 */
interface RecordingContextState {
  // Device information
  orgId: string;
  targetId: string;

  // Recording data
  recordingsByDate: Map<string, Recording[]>;
  setRecordingsByDate: (map: Map<string, Recording[]>) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  actionMessage: string | null;
  setActionMessage: (message: string | null) => void;

  // Calendar state
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  selectedDate: Date | null;
  setSelectedDate: Dispatch<SetStateAction<Date | null>>;

  // Recording actions
  activeRecordingId: string | null;
  setActiveRecordingId: (id: string | null) => void;
  isActionLoading: boolean;
  setIsActionLoading: (loading: boolean) => void;

  // Playback state
  currentRecordingId: string | null;
  setCurrentRecordingId: (id: string | null) => void;
  playbackContext: PlaybackContext<EdgeRecordingDetails> | null;
  setPlaybackContext: (context: PlaybackContext<EdgeRecordingDetails> | null) => void;
  playAllMode: boolean;
  setPlayAllMode: (mode: boolean) => void;
  playAllRecordings: Recording[];
  setPlayAllRecordings: (recordings: Recording[]) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  currentPlaybackTime: Date | null;
  setCurrentPlaybackTime: (time: Date | null) => void;
}

const RecordingContext = createContext<RecordingContextState | undefined>(undefined);

interface RecordingProviderProps {
  readonly serial: string;
  readonly organizationId: string;
  readonly children: ReactNode;
}

/**
 * Provider component that manages shared state for recording and playback features.
 * Eliminates prop drilling by providing context to all child components.
 */
export const RecordingProvider: FC<RecordingProviderProps> = ({
  serial,
  organizationId,
  children,
}) => {
  // Extract device info
  const orgId = organizationId;
  const targetId = serial;

  // Recording data state
  const [recordingsByDate, setRecordingsByDate] = useState<Map<string, Recording[]>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessageState] = useState<string | null>(null);
  const actionMessageTimeoutRef = useRef<number | null>(null);

  const setActionMessage = useCallback((message: string | null) => {
    setActionMessageState(message);

    if (actionMessageTimeoutRef.current !== null) {
      window.clearTimeout(actionMessageTimeoutRef.current);
      actionMessageTimeoutRef.current = null;
    }

    if (message !== null) {
      actionMessageTimeoutRef.current = window.setTimeout(() => {
        setActionMessageState(null);
        actionMessageTimeoutRef.current = null;
      }, 3000);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (actionMessageTimeoutRef.current !== null) {
        window.clearTimeout(actionMessageTimeoutRef.current);
        actionMessageTimeoutRef.current = null;
      }
    };
  }, []);

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Recording action state
  const [activeRecordingId, setActiveRecordingId] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Playback state
  const [currentRecordingId, setCurrentRecordingId] = useState<string | null>(null);
  const [playbackContext, setPlaybackContext] =
    useState<PlaybackContext<EdgeRecordingDetails> | null>(null);
  const [playAllMode, setPlayAllMode] = useState(false);
  const [playAllRecordings, setPlayAllRecordings] = useState<Recording[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState<Date | null>(null);

  // Close the device's WebRTC session when the context is replaced or the provider unmounts.
  useEffect(() => {
    if (playbackContext === null) {
      return;
    }
    return () => {
      playbackContext.disconnect();
    };
  }, [playbackContext]);

  const value: RecordingContextState = {
    orgId,
    targetId,
    recordingsByDate,
    setRecordingsByDate,
    isLoading,
    setIsLoading,
    error,
    setError,
    actionMessage,
    setActionMessage,
    currentMonth,
    setCurrentMonth,
    selectedDate,
    setSelectedDate,
    activeRecordingId,
    setActiveRecordingId,
    isActionLoading,
    setIsActionLoading,
    currentRecordingId,
    setCurrentRecordingId,
    playbackContext,
    setPlaybackContext,
    playAllMode,
    setPlayAllMode,
    playAllRecordings,
    setPlayAllRecordings,
    isPlaying,
    setIsPlaying,
    currentPlaybackTime,
    setCurrentPlaybackTime,
  };

  return <RecordingContext.Provider value={value}>{children}</RecordingContext.Provider>;
};

/**
 * Hook to access the recording context.
 * Must be used within a RecordingProvider.
 */
export const useRecordingContext = (): RecordingContextState => {
  const context = useContext(RecordingContext);
  if (context === undefined) {
    throw new Error("useRecordingContext must be used within a RecordingProvider");
  }
  return context;
};
