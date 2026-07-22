import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { ScreenGlow } from '@/components/screen-glow';
import { Layout } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  /** Paint the premium top glow behind content. On by default. */
  glow?: boolean;
  edges?: readonly Edge[];
  contentContainerStyle?: ViewStyle;
  style?: ViewStyle;
};

/** Safe-area aware screen container: themed background + subtle top glow. */
export function Screen({
  children,
  scroll = false,
  padded = true,
  glow = true,
  edges = ['top', 'left', 'right', 'bottom'],
  contentContainerStyle,
  style,
}: ScreenProps) {
  const theme = useTheme();
  const padding = padded ? { padding: Layout.screenPadding } : null;

  return (
    <SafeAreaView edges={edges} style={[styles.flex, { backgroundColor: theme.background }, style]}>
      {glow ? <ScreenGlow /> : null}
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
