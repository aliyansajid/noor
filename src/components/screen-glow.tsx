import { StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useTheme } from '@/hooks/use-theme';

/**
 * A soft emerald + gold radial glow at the top of a screen that fades into the
 * background — the premium "depth" layer behind content. Purely decorative and
 * non-interactive; sits behind everything.
 */
export function ScreenGlow() {
  const theme = useTheme();
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <RadialGradient id="emerald" cx="0.5" cy="0" r="0.85">
          <Stop offset="0" stopColor={theme.primary} stopOpacity={0.16} />
          <Stop offset="0.65" stopColor={theme.primary} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="gold" cx="0.82" cy="0.04" r="0.5">
          <Stop offset="0" stopColor={theme.accent} stopOpacity={0.1} />
          <Stop offset="1" stopColor={theme.accent} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#emerald)" />
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#gold)" />
    </Svg>
  );
}
