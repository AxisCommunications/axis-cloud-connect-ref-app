/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

/**
 * Describes a single user-configurable parameter for a VAPIX command.
 */
export interface CommandParameter {
  readonly type: "string" | "integer" | "enum";
  readonly required: boolean;
  readonly description: string;
  readonly values?: readonly (string | number | boolean)[];
  readonly default?: string | number | boolean | null;
}

/**
 * Defines a VAPIX command that can be executed through EdgeLink.
 *
 * Commands with parameters must provide `buildQueryParams` (GET) or `buildBody` (POST)
 * to resolve parameter values into the final request shape.
 */
export interface CommandConfig {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly cgi: string;
  readonly method: "GET" | "POST";
  readonly contentType?: string;
  readonly parameters?: Readonly<Record<string, CommandParameter>>;
  readonly queryParams?: Readonly<Record<string, string>>;
  readonly requestBody?: Readonly<Record<string, unknown>>;
  readonly successResponse: string;
  readonly buildQueryParams?: (params: Record<string, string>) => Record<string, string>;
  readonly buildBody?: (params: Record<string, string>) => Record<string, unknown>;
  readonly example?: {
    readonly description?: string;
    readonly request?: string;
    readonly response: string;
  };
}

/**
 * Groups related commands under a named category for UI display.
 */
export interface CommandCategory {
  readonly name: string;
  readonly description: string;
  readonly commands: Readonly<Record<string, CommandConfig>>;
}
