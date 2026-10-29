/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import {
  Button,
  Dropdown,
  Field,
  makeStyles,
  Option,
  OptionGroup,
  Text,
  tokens,
} from "@fluentui/react-components";

import { InfoBox } from "@/components";
import { REMOTE_OPERATIONS } from "@/constants/strings";

import { ParameterField, RequestDetails, ResponseDisplay } from "./components";
import { SELF_DEFINED_COMMAND, useEdgelinkOperationsData } from "./hooks";

const useStyles = makeStyles({
  formField: {
    marginBlockEnd: tokens.spacingVerticalL,
    paddingLeft: tokens.spacingHorizontalS,
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
  },
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
    gap: tokens.spacingVerticalM,
  },
  buttonGroup: {
    display: "flex",
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalM,
  },
  itemHeader: {
    color: tokens.colorNeutralForeground1,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase500,
  },
  commandParametersSection: {
    marginTop: tokens.spacingVerticalM,
  },
  globalError: {
    color: tokens.colorPaletteRedForeground1,
    marginTop: tokens.spacingVerticalM,
  },
});

interface EdgelinkOperationsProps {
  readonly organizationId: string;
  readonly targetId: string;
}

export const EdgelinkOperations: React.FC<EdgelinkOperationsProps> = ({
  organizationId,
  targetId,
}) => {
  const styles = useStyles();
  const {
    selectedCommand,
    commandParameters,
    cgi,
    method,
    body,
    contentType,
    errors,
    hasInvalidParameters,
    globalError,
    bearerToken,
    previewResponse,
    showPreview,
    requestData,
    requestResponse,
    categories,
    deviceInfo,
    selectedCommandName,
    commandConfig,
    setCgi,
    setMethod,
    setBody,
    setContentType,
    handleCommandChange,
    handleParameterChange,
    handlePreviewClick,
    handleSendRequest,
  } = useEdgelinkOperationsData(organizationId, targetId);

  const isSendDisabled =
    selectedCommand === "" ||
    (selectedCommand === SELF_DEFINED_COMMAND && cgi.trim() === "") ||
    hasInvalidParameters;

  return (
    <div className={styles.mainContainer}>
      <InfoBox
        title={REMOTE_OPERATIONS.TITLE}
        header={REMOTE_OPERATIONS.HEADER}
        collapsedHelp={REMOTE_OPERATIONS.COLLAPSED_HELP}
        collapseAriaLabel={REMOTE_OPERATIONS.COLLAPSE_ARIA_LABEL}
        expandAriaLabel={REMOTE_OPERATIONS.EXPAND_ARIA_LABEL}
      >
        <Text as="p">{REMOTE_OPERATIONS.DESCRIPTION}</Text>
      </InfoBox>
      <div className={styles.container}>
        <Field
          label={<Text className={styles.itemHeader}>{REMOTE_OPERATIONS.PREDEFINED_COMMANDS}</Text>}
          className={styles.formField}
        >
          <Dropdown
            value={selectedCommandName}
            onOptionSelect={(_e, data) => handleCommandChange(String(data.optionValue))}
          >
            {Object.entries(categories).map(([categoryId, category]) => (
              <OptionGroup key={categoryId} label={category.name}>
                {Object.values(category.commands).map((command) => (
                  <Option key={command.id} value={command.id}>
                    {command.name}
                  </Option>
                ))}
              </OptionGroup>
            ))}
            <OptionGroup label={REMOTE_OPERATIONS.CUSTOM_GROUP}>
              <Option value={SELF_DEFINED_COMMAND}>{REMOTE_OPERATIONS.CUSTOM_OPERATION}</Option>
            </OptionGroup>
          </Dropdown>
        </Field>

        {selectedCommand !== "" && (
          <>
            {commandConfig?.parameters !== undefined &&
              Object.keys(commandConfig.parameters).length > 0 && (
                <div className={styles.commandParametersSection}>
                  <Text weight="semibold" as="h3">
                    {REMOTE_OPERATIONS.COMMAND_PARAMETERS}
                  </Text>
                  {Object.entries(commandConfig.parameters).map(([key, param]) => (
                    <ParameterField
                      key={key}
                      id={key}
                      parameter={param}
                      commandParameters={commandParameters}
                      onParameterChange={handleParameterChange}
                      errors={errors}
                    />
                  ))}
                </div>
              )}

            <RequestDetails
              cgi={cgi}
              method={method}
              contentType={contentType}
              body={body}
              bearerToken={bearerToken}
              editable={selectedCommand === SELF_DEFINED_COMMAND}
              onCgiChange={setCgi}
              onMethodChange={setMethod}
              onContentTypeChange={setContentType}
              onBodyChange={setBody}
              deviceInfo={deviceInfo}
            />

            <div className={styles.buttonGroup}>
              <Button onClick={handlePreviewClick} disabled={isSendDisabled} appearance="secondary">
                {showPreview ? REMOTE_OPERATIONS.HIDE_PREVIEW : REMOTE_OPERATIONS.PREVIEW_REQUEST}
              </Button>
              <Button onClick={handleSendRequest} disabled={isSendDisabled} appearance="primary">
                {REMOTE_OPERATIONS.SEND_REQUEST}
              </Button>
            </div>
          </>
        )}

        {showPreview && previewResponse !== "" && (
          <ResponseDisplay
            title={REMOTE_OPERATIONS.REQUEST_PREVIEW}
            requestData={requestData}
            variant="request"
            format="json"
            response={previewResponse}
            showCurlButton
          />
        )}
        {requestResponse !== "" && (
          <ResponseDisplay
            title={REMOTE_OPERATIONS.RESPONSE}
            response={requestResponse}
            variant="response"
            format="json"
          />
        )}
        {globalError !== null && <Text className={styles.globalError}>{globalError}</Text>}
      </div>
    </div>
  );
};
