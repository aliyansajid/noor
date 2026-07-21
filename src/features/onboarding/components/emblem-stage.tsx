import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { MOTIFS, MotifKey } from '@/features/onboarding/components/motifs';

/**
 * Presents an emblem over a soft, static gold glow. Motion is deliberately
 * slow and quiet — a gentle vertical float, plus an almost-imperceptible
 * rotation on the star — reading as premium rather than a bouncing pulse.
 */
export function EmblemStage({ motif, size = 116 }: { motif: MotifKey; size?: number }) {
  const Motif = MOTIFS[motif];
  const float = useSharedValue(0);
  const spin = useSharedValue(0);

  useEffect(() => {
    float.value = withRepeat(
      withTiming(1, { duration: 4500, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
    spin.value = withRepeat(withTiming(1, { duration: 48000, easing: Easing.linear }), -1, false);
  }, [float, spin]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -5 + float.value * 10 }],
  }));
  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${(motif === 'star' ? spin.value : 0) * 360}deg` }],
  }));

  return (
    <View style={[styles.stage, { width: size * 2.4, height: size * 2.4 }]}>
      {/* static soft glow */}
      <View style={styles.center} pointerEvents="none">
        <LinearGradient
          colors={['rgba(227,196,107,0.28)', 'rgba(227,196,107,0.06)', 'rgba(227,196,107,0)']}
          style={{ width: size * 2.2, height: size * 2.2, borderRadius: size * 1.1 }}
        />
      </View>
      <Animated.View style={[styles.center, floatStyle]}>
        <Animated.View style={spinStyle}>
          <Motif size={size} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { alignItems: 'center', justifyContent: 'center' },
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
