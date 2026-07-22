/**
 * Resolves the active Noor color set from the user's theme preference.
 * "system" follows the device; otherwise the chosen light/dark wins. When the
 * system scheme is unspecified we fall back to dark — the brand default.
 * https://docs.expo.dev/guides/color-schemes/
 */

import { useColorScheme } from 'react-native';

import { Colors, ColorScheme } from '@/constants/theme';
import { useSettings } from '@/features/settings/settings-context';

export function useColorSchemeName(): ColorScheme {
  const { settings } = useSettings();
  const system = useColorScheme() ?? 'dark';
  return settings.theme === 'system' ? (system as ColorScheme) : settings.theme;
}

export function useTheme() {
  return Colors[useColorSchemeName()];
}
