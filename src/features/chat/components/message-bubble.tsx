import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { AyahCard } from '@/components/ayah-card';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { TypingDots } from '@/features/chat/components/typing-dots';
import { ChatMessage } from '@/features/chat/types';
import { useTheme } from '@/hooks/use-theme';

export function MessageBubble({ message }: { message: ChatMessage }) {
  const theme = useTheme();

  if (message.role === 'user') {
    return (
      <Animated.View entering={FadeIn.duration(180)} style={styles.userRow}>
        <View style={[styles.userBubble, { backgroundColor: theme.primary }]}>
          <ThemedText type="body" style={{ color: theme.textOnPrimary }}>
            {message.text}
          </ThemedText>
        </View>
      </Animated.View>
    );
  }

  // assistant
  return (
    <Animated.View entering={FadeIn} style={styles.assistantRow}>
      {message.text.length === 0 && message.pending ? (
        <TypingDots />
      ) : (
        <ThemedText type="body" themeColor="text" style={styles.assistantText}>
          {message.text}
        </ThemedText>
      )}

      {message.ayat?.map((ayah, i) => (
        <Animated.View key={`${message.id}-ayah-${i}`} entering={FadeInDown.delay(80).duration(280)} style={styles.ayah}>
          <AyahCard
            arabic={ayah.arabic}
            translation={ayah.translation}
            reference={ayah.reference}
            transliteration={ayah.transliteration}
            audio={ayah.audio}
          />
        </Animated.View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  userRow: { alignItems: 'flex-end', marginBottom: Spacing.lg },
  userBubble: {
    maxWidth: '82%',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.xl,
    borderBottomRightRadius: Radius.sm,
  },
  assistantRow: { marginBottom: Spacing.xl, gap: Spacing.md },
  assistantText: { lineHeight: 26 },
  ayah: { marginTop: Spacing.xs },
});
