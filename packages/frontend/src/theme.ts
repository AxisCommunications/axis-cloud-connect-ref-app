/*
 * Copyright (C) 2026 Axis Communications AB, Lund, Sweden
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import { type BrandVariants, createLightTheme } from "@fluentui/react-components";

// Custom theme with Axis brand colors. Used for the FluentProvider in main.tsx.
// The numbers in the brand variants represent lightness levels, with higher numbers being lighter.
// The specific values can be adjusted to achieve the desired look and feel while maintaining good contrast and accessibility.
// For reference, see Fluent UI theming documentation: https://react.fluentui.dev/theming/create-a-theme#color-palette-creation.
const brandVariants: BrandVariants = {
  10: "#050200",
  20: "#1B1100",
  30: "#2D1D00",
  40: "#3F2800",
  50: "#523400",
  60: "#664100",
  70: "#7B4F00",
  80: "#FFCC38",
  90: "#FFD24E",
  100: "#FFD862",
  110: "#FFDE76",
  120: "#FFE48A",
  130: "#FFEA9F",
  140: "#FFF0B5",
  150: "#FFF5CB",
  160: "#FFFAE3",
};

export const customLightTheme = createLightTheme(brandVariants);

// Override some specific colors to ensure good contrast and align with Axis branding.
customLightTheme.colorNeutralForegroundOnBrand = "#000000";
customLightTheme.colorBrandForeground1 = "#eeac30";
customLightTheme.colorBrandBackgroundHover = "#fec136";
customLightTheme.colorNeutralBackground1Hover = "#f0f0f0";
