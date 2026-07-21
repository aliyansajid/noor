import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { Radius, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CardProps = {
  children: ReactNode;
  elevated?: boolean;
  style?: ViewStyle;
};

/** Themed surface container with border + optional elevation. */
export function Card({ children, elevated = false, style }: CardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: elevated ? theme.surfaceElevated : theme.surface,
          borderColor: theme.border,
        },
        elevated && Shadows.card,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
  },
});
