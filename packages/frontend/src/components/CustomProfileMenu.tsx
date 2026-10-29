/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import {
  Avatar,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
} from "@fluentui/react-components";
import { bundleIcon, SignOutFilled, SignOutRegular } from "@fluentui/react-icons";

import { APP } from "@/constants/strings";

const SignOutIcon = bundleIcon(SignOutFilled, SignOutRegular);

interface CustomProfileMenuProps {
  readonly onSignOut: () => void;
}

export const CustomProfileMenu = ({ onSignOut }: CustomProfileMenuProps) => {
  return (
    <Menu>
      <MenuTrigger>
        <MenuButton
          icon={<Avatar color="mink" size={24} />}
          shape="circular"
          appearance="transparent"
        />
      </MenuTrigger>
      <MenuPopover>
        <MenuList>
          <MenuItem onClick={onSignOut} icon={<SignOutIcon />}>
            {APP.SIGN_OUT}
          </MenuItem>
        </MenuList>
      </MenuPopover>
    </Menu>
  );
};
