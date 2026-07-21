/**
 * Resolves the active Noor color set. Dark is the brand default — when the
 * system scheme is unspecified we fall back to dark, not light.
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors, ColorScheme } from '@/constants/theme';

/**
 * Noor is a dark-first, single-theme product for the MVP — the night-emerald
 * palette is the brand. We pin the scheme to dark so the whole app (onboarding,
 * which paints its own dark gradient, and the theme-driven screens) stays
 * visually consistent regardless of the device's system appearance.
 */
export function useColorSchemeName(): ColorScheme {
  return 'dark';
}

export function useTheme() {
  return Colors[useColorSchemeName()];
}
