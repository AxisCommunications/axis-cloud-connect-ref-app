/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import { Card, makeStyles, Text, tokens } from "@fluentui/react-components";
import { useMemo, useState } from "react";

import type { RequestData } from "../types";
import { formatApiResponse } from "../utils";
import { CopyButtons } from "./CopyButtons";

const useStyles = makeStyles({
  container: {
    margin: `0 0 ${tokens.spacingVerticalM} 0`,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  request: {
    backgroundColor: tokens.colorBrandBackground,
  },
  response: {
    backgroundColor: tokens.colorPaletteGreenBackground1,
  },
  content: {
    padding: tokens.spacingVerticalM,
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    margin: `0 0 ${tokens.spacingVerticalS} 0`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    padding: `0 0 ${tokens.spacingVerticalS} 0`,
  },
  title: {
    fontWeight: tokens.fontWeightSemibold,
    flexGrow: 1,
  },
  subtitle: {
    display: "block",
    color: tokens.colorNeutralForeground3,
  },
  pre: {
    whiteSpace: "pre-wrap",
    wordBreak: "break-all",
    padding: tokens.spacingVerticalS,
    borderRadius: tokens.borderRadiusSmall,
    maxHeight: "800px",
    overflow: "auto",
    fontFamily: "monospace",
    fontSize: tokens.fontSizeBase200,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
  },
});

interface ResponseDisplayProps {
  readonly title?: string;
  readonly subtitle?: string;
  readonly response: string;
  readonly requestData?: RequestData;
  readonly variant?: "request" | "response" | "default";
  readonly format?: "json" | "xml";
  readonly showCurlButton?: boolean;
}

const variantStyles: Record<string, "request" | "response" | undefined> = {
  request: "request",
  response: "response",
};

export const ResponseDisplay: React.FC<ResponseDisplayProps> = ({
  title,
  subtitle,
  response,
  requestData,
  variant = "default",
  format = "json",
  showCurlButton = false,
}) => {
  const styles = useStyles();
  const [isBeautified, setIsBeautified] = useState(true);

  const formattedResponse = useMemo(
    () => formatApiResponse(response, format, isBeautified),
    [response, format, isBeautified],
  );

  if (response === "") {
    return null;
  }

  const variantKey = variantStyles[variant];
  const variantClass = variantKey !== undefined ? styles[variantKey] : "";

  return (
    <Card className={variantClass}>
      <div className={styles.content}>
        {title !== undefined && (
          <div className={styles.header}>
            <div>
              <Text className={styles.title} size={300}>
                {title}
              </Text>
              {subtitle !== undefined && (
                <Text className={styles.subtitle} size={200}>
                  {subtitle}
                </Text>
              )}
            </div>
            <CopyButtons
              text={formattedResponse}
              requestData={requestData}
              onBeautify={() => setIsBeautified(!isBeautified)}
              isBeautified={isBeautified}
              showCurlButton={showCurlButton}
            />
          </div>
        )}
        <pre className={styles.pre}>{formattedResponse}</pre>
      </div>
    </Card>
  );
};
