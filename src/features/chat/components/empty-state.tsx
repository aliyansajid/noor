import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { EmblemStage } from '@/features/onboarding/components/emblem-stage';
import { STARTER_PROMPTS } from '@/features/chat/mock-ai';
import { useTheme } from '@/hooks/use-theme';

/** Shown before the first message: greeting + tappable starter prompts.
 * Scrolls when content doesn't fit; centers when it does. */
export function EmptyState({ onPick }: { onPick: (prompt: string) => void }) {
  const theme = useTheme();

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.hero}>
        <EmblemStage motif="star" size={72} />
        <View style={styles.copy}>
          <ThemedText type="title" style={styles.title}>
            Assalāmu ʿalaykum
          </ThemedText>
          <ThemedText type="body" themeColor="textSecondary" style={styles.subtitle}>
            Ask anything about the Qur’an — for guidance, understanding, or a moment of calm.
          </ThemedText>
        </View>
      </View>

      <View style={styles.prompts}>
        {STARTER_PROMPTS.map((p) => (
          <Pressable
            key={p}
            onPress={() => onPick(p)}
            style={({ pressed }) => [
              styles.prompt,
              { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <ThemedText type="bodyMedium" themeColor="text">
              {p}
            </ThemedText>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: Spacing.xl,
    paddingVertical: Spacing.xl,
  },
  hero: { alignItems: 'center', gap: Spacing.md },
  copy: { alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.lg },
  title: { color: '#EDE9DF', textAlign: 'center' },
  subtitle: { textAlign: 'center', maxWidth: 320 },
  prompts: { gap: Spacing.md },
  prompt: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
});
