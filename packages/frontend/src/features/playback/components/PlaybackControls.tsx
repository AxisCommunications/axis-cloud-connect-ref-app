/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import { Button, makeStyles, Text, tokens } from "@fluentui/react-components";
import { Record24Regular } from "@fluentui/react-icons";
import type { FC } from "react";

import { RECORDINGS } from "@/constants/strings";
import { useRecordingContext } from "../context";

const useStyles = makeStyles({
  controlsWrapper: {
    display: "flex",
    gap: tokens.spacingHorizontalM,
    alignItems: "center",
    justifyContent: "center",
  },
  controlRow: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  recordingIconActive: {
    color: tokens.colorPaletteRedForeground1,
  },
});

interface PlaybackControlsProps {
  readonly onStartRecording: () => Promise<void>;
  readonly onStopRecording: () => Promise<void>;
  readonly disableControls: boolean;
}

/**
 * PlaybackControls provides UI for manual recording control and event-based recording setup.
 * Displays current recording status and action messages/errors.
 */
export const PlaybackControls: FC<PlaybackControlsProps> = ({
  onStartRecording,
  onStopRecording,
  disableControls,
}) => {
  const styles = useStyles();
  const { activeRecordingId, isActionLoading } = useRecordingContext();

  return (
    <div className={styles.controlsWrapper}>
      {/* Manual Recording */}
      <div className={styles.controlRow}>
        <Text weight="semibold" size={300}>
          {RECORDINGS.CONTINUOUS_RECORDING}
        </Text>
        <Button
          icon={
            <Record24Regular
              className={activeRecordingId !== null ? styles.recordingIconActive : undefined}
            />
          }
          appearance="primary"
          size="small"
          disabled={isActionLoading || disableControls}
          onClick={activeRecordingId !== null ? onStopRecording : onStartRecording}
        >
          {activeRecordingId !== null ? RECORDINGS.STOP : RECORDINGS.START}
        </Button>
      </div>
    </div>
  );
};
