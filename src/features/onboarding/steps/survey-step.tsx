import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { OptionPill } from '@/features/onboarding/components/option-pill';
import { ProgressBar } from '@/features/onboarding/components/progress-bar';
import { SurveyQuestion } from '@/features/onboarding/content';

type Props = {
  question: SurveyQuestion;
  progress: number;
  onContinue: (selected: string[]) => void;
};

export function SurveyStep({ question, progress, onContinue }: Props) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (key: string) => {
    setSelected((prev) => {
      if (question.multiSelect) {
        return prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      }
      return [key];
    });
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <ProgressBar progress={progress} />
        <ThemedText type="title" style={styles.question}>
          {question.question}
        </ThemedText>
        <ThemedText type="label" style={styles.helper}>
          {question.helper}
        </ThemedText>
      </View>

      <ScrollView
        contentContainerStyle={styles.options}
        showsVerticalScrollIndicator={false}
      >
        {question.options.map((opt, i) => (
          <Animated.View key={opt.key} entering={FadeInDown.delay(i * 45).springify()}>
            <OptionPill
              label={opt.label}
              selected={selected.includes(opt.key)}
              onPress={() => toggle(opt.key)}
            />
          </Animated.View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Continue"
          disabled={selected.length === 0}
          onPress={() => onContinue(selected)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: Spacing.xl, gap: Spacing.lg, paddingBottom: Spacing.xl },
  question: { color: '#EDE9DF' },
  helper: { color: '#E3C46B', letterSpacing: 0.5 },
  options: { paddingHorizontal: Spacing.xl, gap: Spacing.md, paddingBottom: Spacing.xl },
  footer: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl },
});
