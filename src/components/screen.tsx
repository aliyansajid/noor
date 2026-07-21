import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { Layout } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  edges?: readonly Edge[];
  contentContainerStyle?: ViewStyle;
  style?: ViewStyle;
};

/** Safe-area aware screen container that paints the themed background. */
export function Screen({
  children,
  scroll = false,
  padded = true,
  edges = ['top', 'left', 'right', 'bottom'],
  contentContainerStyle,
  style,
}: ScreenProps) {
  const theme = useTheme();
  const padding = padded ? { padding: Layout.screenPadding } : null;

  return (
    <SafeAreaView edges={edges} style={[styles.flex, { backgroundColor: theme.background }, style]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[padding, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, padding, contentContainerStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
