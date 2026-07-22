import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Stop } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { formatTime } from '@/features/settings/settings';
import { useSettings } from '@/features/settings/settings-context';
import { useTheme } from '@/hooks/use-theme';

const AnimatedG = Animated.createAnimatedComponent(G);

// Dome geometry (viewBox units): the arc from sunrise (left) to sunset (right).
const CX = 160;
const BASE = 150;
const R = 120;
const ARC = `M ${CX - R} ${BASE} A ${R} ${R} 0 0 1 ${CX + R} ${BASE}`;
const FILL = `${ARC} Z`;

// Sun rays, relative to the sun's center (drawn inside the translated group).
const RAYS =
  'M 0 -12 L 0 -19 M 0 12 L 0 19 M -12 0 L -19 0 M 12 0 L 19 0 ' +
  'M -8.5 -8.5 L -13.4 -13.4 M 8.5 -8.5 L 13.4 -13.4 ' +
  'M -8.5 8.5 L -13.4 13.4 M 8.5 8.5 L 13.4 13.4';

function toMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Sky-scene visualization of the day: a soft dawn wash under a gold dome, with
 * a small rayed sun that animates from sunrise to the current time. At night the
 * sun sets and a muted moon rests over the dimmed scene.
 */
export function SunArc({ sunrise, sunset, now }: { sunrise: string; sunset: string; now: Date }) {
  const theme = useTheme();
  const { settings } = useSettings();

  const sr = toMinutes(sunrise);
  const ss = toMinutes(sunset);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const isDay = ss > sr && nowMin >= sr && nowMin <= ss;
  const fraction = isDay ? (nowMin - sr) / (ss - sr) : nowMin < sr ? 0 : 1;

  // Sweep 0 → fraction on mount; nudge smoothly on later minute ticks.
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(fraction, { duration: 1500, easing: Easing.out(Easing.cubic) });
  }, [fraction, progress]);

  const sunGroupProps = useAnimatedProps(() => {
    const a = Math.PI * (1 - progress.value);
    return { transform: [{ translateX: CX + R * Math.cos(a) }, { translateY: BASE - R * Math.sin(a) }] };
  });

  return (
    <View>
      <Svg width="100%" height={150} viewBox="0 0 320 168">
        <Defs>
          <LinearGradient id="sunSky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={theme.accent} stopOpacity={0.24} />
            <Stop offset="0.55" stopColor={theme.primary} stopOpacity={0.09} />
            <Stop offset="1" stopColor={theme.primary} stopOpacity={0.02} />
          </LinearGradient>
        </Defs>

        {isDay ? <Path d={FILL} fill="url(#sunSky)" /> : null}

        <Path
          d={ARC}
          fill="none"
          stroke={theme.accent}
          strokeWidth={1.5}
          strokeOpacity={isDay ? 0.55 : 0.25}
          strokeLinecap="round"
        />

        <Line x1={CX - R - 8} y1={BASE} x2={CX + R + 8} y2={BASE} stroke={theme.borderStrong} strokeWidth={1.5} />

        {isDay ? (
          <AnimatedG animatedProps={sunGroupProps}>
            <Path d={RAYS} stroke={theme.accent} strokeWidth={1.8} strokeLinecap="round" opacity={0.9} />
            <Circle cx={0} cy={0} r={8} fill={theme.accent} />
          </AnimatedG>
        ) : (
          <Circle cx={CX} cy={36} r={8} fill={theme.textMuted} opacity={0.75} />
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
