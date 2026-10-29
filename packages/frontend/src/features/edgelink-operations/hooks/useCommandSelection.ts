/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import { useState } from "react";

import { COMMANDS_BY_CATEGORY, type CommandParameter, EDGELINK_COMMANDS } from "@/api";
import { EDGELINK } from "@/constants/strings";

import { ValidationError, ValidationRules, validateValue } from "../utils";

const getParameterError = (
  key: string,
  parameter: CommandParameter,
  value: string,
): string | undefined => {
  if (value.trim() === "") {
    return parameter.required ? `${key} is required` : undefined;
  }

  const rules = [];
  if (parameter.type === "integer") {
    rules.push(ValidationRules.integer(key));
  }
  if (parameter.values !== undefined) {
    rules.push(
      ValidationRules.enum(
        key,
        parameter.values.map((allowedValue) => String(allowedValue)),
      ),
    );
  }

  try {
    validateValue(value, rules);
    return undefined;
  } catch (error) {
    if (error instanceof ValidationError) {
      return error.message;
    }
    throw error;
  }
};

export const useCommandSelection = () => {
  const [selectedCommand, setSelectedCommand] = useState("");
  const [commandParameters, setCommandParameters] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const commands = EDGELINK_COMMANDS;
  const categories = COMMANDS_BY_CATEGORY;

  const commandConfig = commands[selectedCommand];
  const selectedCommandName = commandConfig?.name ?? EDGELINK.REQUEST_TEMPLATE;

  // Covers required parameters the user has not touched yet, which have no entry in `errors`.
  const hasInvalidParameters = Object.entries(commandConfig?.parameters ?? {}).some(
    ([key, parameter]) =>
      getParameterError(key, parameter, commandParameters[key] ?? "") !== undefined,
  );

  const selectCommand = (commandId: string) => {
    setSelectedCommand(commandId);
    setCommandParameters({});
    setErrors({});
  };

  const handleParameterChange = (key: string, value: string) => {
    const parameter = commandConfig?.parameters?.[key];
    if (parameter === undefined) {
      return;
    }

    setCommandParameters((previous) => {
      const next = { ...previous };
      if (value === "") {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
    setErrors((previous) => ({ ...previous, [key]: getParameterError(key, parameter, value) }));
  };

  return {
    selectedCommand,
    commandParameters,
    errors,
    hasInvalidParameters,
    commands,
    categories,
    commandConfig,
    selectedCommandName,
    selectCommand,
    handleParameterChange,
  };
};
