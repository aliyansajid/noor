import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { EmblemStage } from '@/features/onboarding/components/emblem-stage';

type Props = {
  title: string;
  subtitle: string;
  cta?: string;
  onContinue: () => void;
};

/** Full-screen motivational beat with the pulsing Noor light. */
export function InterstitialStep({ title, subtitle, cta = 'Continue', onContinue }: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.center}>
        <Animated.View entering={FadeIn.duration(600)}>
          <EmblemStage motif="star" size={116} />
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.copy}>
          <ThemedText type="title" style={styles.title}>
            {title}
          </ThemedText>
          <ThemedText type="body" style={styles.subtitle}>
            {subtitle}
          </ThemedText>
        </Animated.View>
      </View>
      <View style={styles.footer}>
        <Button title={cta} onPress={onContinue} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.xl },
  copy: { alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.xl },
  title: { color: '#EDE9DF', textAlign: 'center' },
  subtitle: { color: '#A7B0A9', textAlign: 'center', maxWidth: 320 },
  footer: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl },
});
