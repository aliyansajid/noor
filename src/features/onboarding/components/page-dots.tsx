import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { Palette } from '@/constants/theme';

/** Animated page indicator — the active dot stretches into a gold pill. */
export function PageDots({ count, activeIndex }: { count: number; activeIndex: number }) {
  return (
    <View style={styles.row}>
      {Array.from({ length: count }).map((_, i) => (
        <Dot key={i} active={i === activeIndex} />
      ))}
    </View>
  );
}

function Dot({ active }: { active: boolean }) {
  const style = useAnimatedStyle(() => ({
    width: withTiming(active ? 24 : 8, { duration: 250 }),
    backgroundColor: withTiming(active ? Palette.gold : 'rgba(237,233,223,0.25)', { duration: 250 }),
  }));
  return <Animated.View style={[styles.dot, style]} />;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  dot: { height: 8, borderRadius: 4 },
});
