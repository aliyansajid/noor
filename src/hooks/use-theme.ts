/**
 * Resolves the active Noor color set. Dark is the brand default — when the
 * system scheme is unspecified we fall back to dark, not light.
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors, ColorScheme } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useColorSchemeName(): ColorScheme {
  const scheme = useColorScheme();
  return scheme === 'light' ? 'light' : 'dark';
}

export function useTheme() {
  return Colors[useColorSchemeName()];
}
