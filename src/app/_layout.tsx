import { setAudioModeAsync } from 'expo-audio';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/features/auth/auth-context';
import { SettingsProvider, useSettings } from '@/features/settings/settings-context';
import { useAppFonts } from '@/hooks/use-app-fonts';
import { useColorSchemeName } from '@/hooks/use-theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <SettingsProvider>
            <ThemedApp />
          </SettingsProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/** Rendered inside SettingsProvider so the theme can react to the user's choice. */
function ThemedApp() {
  const scheme = useColorSchemeName();
  const { loaded, error } = useAppFonts();
  const { loaded: stateLoaded } = useSettings();
  const { loading: authLoading } = useAuth();
  const ready = (loaded || error) && stateLoaded && !authLoading;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  // Recitation should play even when the iOS ringer switch is silenced.
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  if (!ready) {
    return null;
  }

  const colors = Colors[scheme];
  const navTheme = scheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <ThemeProvider
      value={{
        ...navTheme,
        colors: {
          ...navTheme.colors,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
          primary: colors.primary,
        },
      }}
    >
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}
      >
        {/* These push over content, so use the normal platform slide, not the
            app-wide fade. */}
        <Stack.Screen name="edition-picker" options={{ animation: 'default' }} />
        <Stack.Screen name="auth" options={{ animation: 'default' }} />
      </Stack>
    </ThemeProvider>
  );
}
