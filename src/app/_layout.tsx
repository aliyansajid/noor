import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useAppFonts } from '@/hooks/use-app-fonts';
import { useColorSchemeName } from '@/hooks/use-theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const scheme = useColorSchemeName();
  const { loaded, error } = useAppFonts();

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  const colors = Colors[scheme];
  const navTheme = scheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
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
          />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
