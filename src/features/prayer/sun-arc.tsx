import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { formatTime } from '@/features/settings/settings';
import { useSettings } from '@/features/settings/settings-context';
import { useTheme } from '@/hooks/use-theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

// Arc geometry (viewBox units): a semicircle from sunrise (left) to sunset (right).
const CX = 160;
const BASE = 150;
const R = 130;
const ARC = `M ${CX - R} ${BASE} A ${R} ${R} 0 0 1 ${CX + R} ${BASE}`;
const ARC_LEN = Math.PI * R;

function toMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/**
 * The sun's journey for the day: an arc from Sunrise to Sunset with a sun that
 * animates to the current time (climbs and sets). At night it shows a moon.
 */
export function SunArc({ sunrise, sunset, now }: { sunrise: string; sunset: string; now: Date }) {
  const theme = useTheme();
  const { settings } = useSettings();

  const sr = toMinutes(sunrise);
  const ss = toMinutes(sunset);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const isDay = ss > sr && nowMin >= sr && nowMin <= ss;
  const fraction = isDay ? (nowMin - sr) / (ss - sr) : nowMin < sr ? 0 : 1;

  // Sweeps 0 → fraction on mount (the day so far); nudges smoothly on later ticks.
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(fraction, { duration: 1500, easing: Easing.out(Easing.cubic) });
  }, [fraction, progress]);

  const sunProps = useAnimatedProps(() => {
    const a = Math.PI * (1 - progress.value);
    return { cx: CX + R * Math.cos(a), cy: BASE - R * Math.sin(a) };
  });
  const arcProps = useAnimatedProps(() => ({
    strokeDashoffset: ARC_LEN * (1 - progress.value),
  }));

  return (
    <View>
      <Svg width="100%" height={148} viewBox="0 0 320 170">
        <Defs>
          <LinearGradient id="sunArc" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={theme.accent} />
            <Stop offset="0.5" stopColor={theme.primary} />
            <Stop offset="1" stopColor={theme.accent} />
          </LinearGradient>
        </Defs>

        {/* full track, faint */}
        <Path d={ARC} stroke={theme.border} strokeWidth={2} fill="none" strokeLinecap="round" />

        {/* traveled portion, sunrise → now */}
        {isDay ? (
          <AnimatedPath
            d={ARC}
            stroke="url(#sunArc)"
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={ARC_LEN}
            animatedProps={arcProps}
          />
        ) : null}

        {/* horizon */}
        <Line x1={CX - R} y1={BASE} x2={CX + R} y2={BASE} stroke={theme.border} strokeWidth={1} />

        {isDay ? (
          <>
            <AnimatedCircle animatedProps={sunProps} r={16} fill={theme.accent} opacity={0.22} />
            <AnimatedCircle animatedProps={sunProps} r={9} fill={theme.accent} />
          </>
        ) : (
          // night — a soft crescent stand-in
          <Circle cx={CX} cy={34} r={9} fill={theme.textMuted} opacity={0.7} />
        )}
      </Svg>

      <View style={styles.labels}>
        <View>
          <ThemedText type="caption" themeColor="textMuted">
            Sunrise
          </ThemedText>
          <ThemedText type="bodyMedium" themeColor="text">
            {formatTime(sunrise, settings.timeFormat)}
          </ThemedText>
        </View>
        <View style={styles.right}>
          <ThemedText type="caption" themeColor="textMuted">
            Sunset
          </ThemedText>
          <ThemedText type="bodyMedium" themeColor="text">
            {formatTime(sunset, settings.timeFormat)}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  right: { alignItems: 'flex-end' },
});
