import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';

type Variant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = Omit<PressableProps, 'style'> & {
  title: string;
  variant?: Variant;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  style?: ViewStyle;
};

export function Button({
  title,
  variant = 'primary',
  loading = false,
  fullWidth = true,
  leftIcon,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const theme = useTheme();

  const bg: Record<Variant, string> = {
    primary: theme.primary,
    secondary: theme.surfaceElevated,
    ghost: 'transparent',
  };
  const fg: Record<Variant, string> = {
    primary: theme.textOnPrimary,
    secondary: theme.text,
    ghost: theme.primary,
  };
  const border: Record<Variant, string> = {
    primary: theme.primary,
    secondary: theme.border,
    ghost: 'transparent',
  };

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bg[variant],
          borderColor: border[variant],
          width: fullWidth ? '100%' : undefined,
          opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
        },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={fg[variant]} />
      ) : (
        <View style={styles.content}>
          {leftIcon}
          <ThemedText style={[Typography.button, { color: fg[variant] }]}>{title}</ThemedText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 54,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
});
