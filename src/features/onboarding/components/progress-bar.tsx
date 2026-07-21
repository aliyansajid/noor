import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { Palette } from '@/constants/theme';

/** Slim survey progress bar. `progress` is 0..1. */
export function ProgressBar({ progress }: { progress: number }) {
  const fill = useAnimatedStyle(() => ({
    width: withTiming(`${Math.min(1, Math.max(0, progress)) * 100}%`, { duration: 300 }),
  }));
  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, fill]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(237,233,223,0.12)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: Palette.gold,
  },
});
