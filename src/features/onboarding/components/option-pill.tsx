import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Palette, Radius, Spacing } from '@/constants/theme';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

/** Selectable survey option with a gold radio and soft selected state. */
export function OptionPill({ label, selected, onPress }: Props) {
  const container = useAnimatedStyle(() => ({
    borderColor: withTiming(selected ? Palette.gold : 'rgba(237,233,223,0.14)', { duration: 180 }),
    backgroundColor: withTiming(
      selected ? 'rgba(227,196,107,0.10)' : 'rgba(237,233,223,0.05)',
      { duration: 180 },
    ),
  }));
  const dot = useAnimatedStyle(() => ({
    borderColor: withTiming(selected ? Palette.gold : 'rgba(237,233,223,0.35)', { duration: 180 }),
    backgroundColor: withTiming(selected ? Palette.gold : 'transparent', { duration: 180 }),
  }));

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
    >
      <Animated.View style={[styles.pill, container]}>
        <ThemedText type="bodyMedium" style={styles.label}>
          {label}
        </ThemedText>
        <Animated.View style={[styles.radio, dot]}>
          {selected ? <View style={styles.check} /> : null}
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  label: { color: '#EDE9DF', flex: 1, marginRight: Spacing.md },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0E1512',
  },
});
