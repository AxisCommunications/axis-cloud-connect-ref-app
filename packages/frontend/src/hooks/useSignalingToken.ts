/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import type { Token, TokenRequest } from "@axis-communications/axis-web-video-player";
import { useCallback } from "react";

import { getToken } from "../auth";

/**
 * Provides a stable callback for requesting signaling tokens.
 * Uses the same access token from the token store — no separate backend endpoint needed.
 */
export const useSignalingToken = () => {
  const createOnTokenRequest = useCallback(async (_request: TokenRequest): Promise<Token> => {
    const token = await getToken();
    return { type: "Bearer", token };
  }, []);

  return { createOnTokenRequest };
};
