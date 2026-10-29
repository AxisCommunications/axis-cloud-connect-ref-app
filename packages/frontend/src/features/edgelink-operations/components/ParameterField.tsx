/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import { Dropdown, Field, Input, makeStyles, Option, tokens } from "@fluentui/react-components";
import type { FC } from "react";

import type { CommandParameter } from "@/api";
import { EDGELINK } from "@/constants/strings";

const useStyles = makeStyles({
  formField: {
    marginBlockEnd: tokens.spacingVerticalL,
    paddingLeft: tokens.spacingHorizontalS,
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
  },
});

interface ParameterFieldProps {
  readonly id: string;
  readonly parameter: CommandParameter;
  readonly commandParameters: Record<string, string>;
  readonly onParameterChange: (key: string, value: string) => void;
  readonly errors: Record<string, string | undefined>;
}

export const ParameterField: FC<ParameterFieldProps> = ({
  id,
  commandParameters,
  parameter,
  onParameterChange,
  errors,
}) => {
  const styles = useStyles();

  return (
    <Field
      key={id}
      // First letter capitalized for better readability
      label={id.charAt(0).toUpperCase() + id.slice(1)}
      validationMessage={errors[id]}
      className={styles.formField}
      required={parameter.required}
    >
      {parameter.type === "enum" && parameter.values !== undefined ? (
        <Dropdown
          onOptionSelect={(_e, data) => onParameterChange(id, String(data.optionValue))}
          placeholder={EDGELINK.SELECT_OPTION}
        >
          {parameter.values.map((v) => (
            <Option key={String(v)} value={String(v)}>
              {String(v)}
            </Option>
          ))}
        </Dropdown>
      ) : (
        <Input
          value={commandParameters[id] ?? ""}
          onChange={(_e, data) => onParameterChange(id, data.value)}
          required={parameter.required}
          type={parameter.type === "integer" ? "number" : "text"}
        />
      )}
    </Field>
  );
};
