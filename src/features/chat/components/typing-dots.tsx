import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/hooks/use-theme';

/** Three softly pulsing dots shown while the assistant is composing. */
export function TypingDots() {
  return (
    <View style={styles.row}>
      <Dot delay={0} />
      <Dot delay={160} />
      <Dot delay={320} />
    </View>
  );
}

function Dot({ delay }: { delay: number }) {
  const theme = useTheme();
  const v = useSharedValue(0.3);

  useEffect(() => {
    v.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 500, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
      ),
    );
  }, [v, delay]);

  const style = useAnimatedStyle(() => ({ opacity: v.value, transform: [{ scale: 0.85 + v.value * 0.3 }] }));
  return <Animated.View style={[styles.dot, { backgroundColor: theme.primary }, style]} />;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, alignItems: 'center', paddingVertical: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
