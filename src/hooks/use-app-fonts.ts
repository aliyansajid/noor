/**
 * Loads the Noor font families. Keep the registered keys in sync with
 * `FontFamily` in constants/theme.ts.
 */

import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Fraunces_600SemiBold, Fraunces_700Bold } from '@expo-google-fonts/fraunces';
import { Amiri_400Regular, Amiri_700Bold } from '@expo-google-fonts/amiri';
import { useFonts } from 'expo-font';

export function useAppFonts() {
  const [loaded, error] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Amiri_400Regular,
    Amiri_700Bold,
  });

  return { loaded, error };
}
