import * as Haptics from 'expo-haptics';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { EmblemStage } from '@/features/onboarding/components/emblem-stage';
import { STARTER_PROMPTS } from '@/features/chat/ai';
import { ConversationSummary } from '@/features/chat/history';
import { useTheme } from '@/hooks/use-theme';

/** Shown before the first message: greeting, recent chats (signed in), and
 * tappable starter prompts. Scrolls when content doesn't fit; centers when it does. */
export function EmptyState({
  onPick,
  recent = [],
  onOpen,
}: {
  onPick: (prompt: string) => void;
  recent?: ConversationSummary[];
  onOpen?: (id: string, title: string) => void;
}) {
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

      {recent.length && onOpen ? (
        <View style={styles.recent}>
          <ThemedText type="caption" themeColor="accent" style={styles.recentLabel}>
            RECENT
          </ThemedText>
          {recent.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => {
                Haptics.selectionAsync();
                onOpen(c.id, c.title);
              }}
              style={({ pressed }) => [styles.recentRow, { opacity: pressed ? 0.6 : 1 }]}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M3 12a9 9 0 1 0 9-9 9 9 0 0 0-8 5M3 4v4h4M12 7v5l3.5 2"
                  stroke={theme.textMuted}
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <ThemedText type="bodyMedium" themeColor="text" numberOfLines={1} style={styles.recentTitle}>
                {c.title}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.prompts}>
        {STARTER_PROMPTS.map((p) => (
          <Pressable
            key={p}
            onPress={() => {
              Haptics.selectionAsync();
              onPick(p);
            }}
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
  recent: { gap: Spacing.xs },
  recentLabel: { letterSpacing: 1.5, marginBottom: Spacing.xs },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm },
  recentTitle: { flex: 1 },
});

