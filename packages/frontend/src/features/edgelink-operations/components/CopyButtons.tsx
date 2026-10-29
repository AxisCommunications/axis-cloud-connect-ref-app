/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import { Button, makeStyles, Tooltip, tokens } from "@fluentui/react-components";
import { CopyRegular, GlobeRegular, WandRegular } from "@fluentui/react-icons";

import { EDGELINK } from "@/constants/strings";

import type { RequestData } from "../types";
import { generateCurlCommand } from "../utils";

const useStyles = makeStyles({
  button: {
    minWidth: "auto",
    padding: tokens.spacingHorizontalXS,
  },
});

interface CopyButtonsProps {
  readonly text: string;
  readonly requestData?: RequestData;
  readonly onBeautify?: () => void;
  readonly isBeautified?: boolean;
  readonly showBeautifyButton?: boolean;
  readonly showCopyButton?: boolean;
  readonly showCurlButton?: boolean;
}

export const CopyButtons: React.FC<CopyButtonsProps> = ({
  text,
  requestData,
  onBeautify,
  isBeautified,
  showBeautifyButton = true,
  showCopyButton = true,
  showCurlButton = false,
}) => {
  const styles = useStyles();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard write can fail if the document is not focused
    }
  };

  const handleCopyCurl = async () => {
    if (requestData === undefined) {
      return;
    }
    try {
      // Generate a complete curl command, including all headers and properly formatted request body
      const curlCommand = generateCurlCommand(requestData);
      await navigator.clipboard.writeText(curlCommand);
    } catch {
      // Clipboard write can fail if the document is not focused
    }
  };

  return (
    <>
      {showBeautifyButton && onBeautify !== undefined && (
        <Tooltip
          content={isBeautified ? EDGELINK.SHOW_RAW : EDGELINK.BEAUTIFY}
          relationship="description"
        >
          <Button
            className={styles.button}
            appearance={isBeautified ? "primary" : "subtle"}
            icon={<WandRegular />}
            onClick={onBeautify}
            size="small"
            aria-label={isBeautified ? EDGELINK.SHOW_RAW : EDGELINK.BEAUTIFY}
          />
        </Tooltip>
      )}

      {showCopyButton && (
        <Tooltip content={EDGELINK.COPY_TO_CLIPBOARD} relationship="description">
          <Button
            className={styles.button}
            appearance="subtle"
            icon={<CopyRegular />}
            onClick={handleCopy}
            size="small"
            aria-label={EDGELINK.COPY_TO_CLIPBOARD}
          />
        </Tooltip>
      )}

      {showCurlButton && requestData !== undefined && (
        <Tooltip content={EDGELINK.COPY_AS_CURL} relationship="description">
          <Button
            className={styles.button}
            appearance="subtle"
            icon={<GlobeRegular />}
            onClick={handleCopyCurl}
            size="small"
            aria-label={EDGELINK.COPY_AS_CURL}
          />
        </Tooltip>
      )}
    </>
  );
};
