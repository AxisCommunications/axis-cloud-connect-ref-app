/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import {
  Dropdown,
  Field,
  Input,
  makeStyles,
  Option,
  Text,
  Textarea,
  tokens,
} from "@fluentui/react-components";

import { EDGELINK } from "@/constants/strings";

import type { DeviceInfo } from "../types";
import { HighlightedUrl } from "./HighlightedUrl";

const useStyles = makeStyles({
  formField: {
    marginBlockEnd: tokens.spacingVerticalL,
    paddingLeft: tokens.spacingHorizontalS,
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
  },
  itemHeader: {
    color: tokens.colorNeutralForeground1,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase500,
  },
  detailsContainer: {
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalM}`,
    marginTop: tokens.spacingVerticalL,
  },
});

interface RequestDetailsProps {
  readonly cgi: string;
  readonly method: "GET" | "POST";
  readonly contentType: string;
  readonly body: string;
  readonly bearerToken: string;
  readonly editable: boolean;
  readonly deviceInfo: DeviceInfo;
  readonly onCgiChange: (value: string) => void;
  readonly onMethodChange: (value: "GET" | "POST") => void;
  readonly onContentTypeChange: (value: string) => void;
  readonly onBodyChange: (value: string) => void;
}

export const RequestDetails: React.FC<RequestDetailsProps> = ({
  cgi,
  method,
  contentType,
  body,
  bearerToken,
  editable,
  deviceInfo,
  onCgiChange,
  onMethodChange,
  onContentTypeChange,
  onBodyChange,
}) => {
  const styles = useStyles();

  return (
    <div className={styles.detailsContainer}>
      <Text className={styles.itemHeader}>{EDGELINK.REQUEST_DETAILS}</Text>
      <div />
      <div>
        <Field label={EDGELINK.ENDPOINT_PATH} className={styles.formField}>
          <Input
            value={cgi}
            readOnly={!editable}
            onChange={(_e, data) => onCgiChange(data.value)}
          />
        </Field>
        <HighlightedUrl
          baseUrl={deviceInfo.edgelinkBaseUrl}
          organizationId={deviceInfo.organizationId}
          targetId={deviceInfo.targetId}
          cgi={cgi}
        />
      </div>
      <Field label={EDGELINK.METHOD} className={styles.formField}>
        <Dropdown
          value={method}
          disabled={!editable}
          onOptionSelect={(_e, data) => onMethodChange(data.optionValue as "GET" | "POST")}
        >
          <Option value="GET">GET</Option>
          <Option value="POST">POST</Option>
        </Dropdown>
      </Field>
      <Field label={EDGELINK.CONTENT_TYPE} className={styles.formField}>
        <Input
          value={contentType}
          readOnly={!editable}
          onChange={(_e, data) => onContentTypeChange(data.value)}
        />
      </Field>
      {bearerToken !== "" && (
        <Field
          label={EDGELINK.BEARER_TOKEN}
          hint={EDGELINK.BEARER_TOKEN_WARNING}
          className={styles.formField}
        >
          <Textarea value={bearerToken} readOnly rows={1} resize="none" />
        </Field>
      )}
      {method === "POST" && (
        <Field label={EDGELINK.REQUEST_BODY} className={styles.formField}>
          <Textarea
            value={body}
            readOnly={!editable}
            onChange={(_e, data) => onBodyChange(data.value)}
            rows={4}
            resize="vertical"
          />
        </Field>
      )}
    </div>
  );
};
