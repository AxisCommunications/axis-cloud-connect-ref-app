/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import type { CommandConfig } from "../types";

export const usersCommands: Record<string, CommandConfig> = {
  createUser: {
    id: "createUser",
    name: "Create Local User",
    cgi: "axis-cgi/pwdgrp.cgi",
    method: "POST",
    contentType: "raw",
    parameters: {
      username: {
        type: "string",
        required: true,
        description: "Username for the new account",
      },
      password: {
        type: "string",
        required: true,
        description: "Password for the new account",
      },
    },
    requestBody: {
      action: "add",
      user: "",
      pwd: "",
      grp: "users",
      sgrp: "viewer:operator:admin:ptz",
      strict_pwd: "1",
    },
    buildBody: (params) => ({
      action: "add",
      user: params.username ?? "",
      pwd: params.password ?? "",
      grp: "users",
      sgrp: "viewer:operator:admin:ptz",
      strict_pwd: "1",
    }),
    successResponse: "OK",
  },
};
