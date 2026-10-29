/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import { MessageBar, MessageBarTitle } from "@fluentui/react-components";
import type { FC } from "react";

import { COMMON } from "@/constants/strings";

interface DisplayErrorProps {
  readonly error: string;
}

export const DisplayError: FC<DisplayErrorProps> = ({ error: errorMsg }) => {
  return (
    <MessageBar intent="error">
      <MessageBarTitle>{COMMON.ERROR_TITLE}</MessageBarTitle>
      {errorMsg}
    </MessageBar>
  );
};
