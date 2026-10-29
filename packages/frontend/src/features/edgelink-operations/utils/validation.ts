/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

/**
 * Base error class for all application errors.
 */
class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * Error class for validation failures.
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

interface ValidationRule {
  readonly validate: (value: unknown) => boolean;
  readonly message: string;
}

export const ValidationRules = {
  required: (fieldName: string): ValidationRule => ({
    validate: (value: unknown) => {
      if (typeof value === "string") {
        return value.trim().length > 0;
      }
      return value !== null && value !== undefined;
    },
    message: `${fieldName} is required`,
  }),

  integer: (fieldName: string): ValidationRule => ({
    validate: (value: unknown) => {
      if (typeof value === "string") {
        return /^-?\d+$/.test(value.trim());
      }
      return typeof value === "number" && Number.isInteger(value);
    },
    message: `${fieldName} must be a valid integer`,
  }),

  enum: (fieldName: string, allowedValues: unknown[]): ValidationRule => ({
    validate: (value: unknown) => allowedValues.includes(value),
    message: `${fieldName} must be one of: ${allowedValues.join(", ")}`,
  }),
};

export const validateValue = (value: unknown, rules: ValidationRule[]): void => {
  for (const rule of rules) {
    if (!rule.validate(value)) {
      throw new ValidationError(rule.message);
    }
  }
};
