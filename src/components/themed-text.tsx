import { Text, type TextProps } from 'react-native';

import { ThemeColor, Typography, TypographyVariant } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  /** Type-scale preset from the design system. Defaults to `body`. */
  type?: TypographyVariant;
  /** Semantic color key. Defaults to `text`. */
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'body', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[{ color: theme[themeColor ?? 'text'] }, Typography[type], style]}
      {...rest}
    />
  );
}
