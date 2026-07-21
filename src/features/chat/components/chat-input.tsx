import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = { onSend: (text: string) => void; disabled?: boolean };

export function ChatInput({ onSend, disabled }: Props) {
  const theme = useTheme();
  const [value, setValue] = useState('');
  const canSend = value.trim().length > 0 && !disabled;

  const send = () => {
    if (!canSend) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSend(value.trim());
    setValue('');
  };

  return (
    <View style={[styles.wrap, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <TextInput
        value={value}
        onChangeText={setValue}
        placeholder="Ask about the Qur’an…"
        placeholderTextColor={theme.textMuted}
        style={[styles.input, { color: theme.text }]}
        multiline
        maxLength={500}
      />
      <Pressable
        onPress={send}
        disabled={!canSend}
        style={[
          styles.send,
          { backgroundColor: canSend ? theme.primary : theme.surfaceSelected, opacity: canSend ? 1 : 0.6 },
        ]}
      >
        <Svg width={20} height={20} viewBox="0 0 24 24">
          <Path
            d="M4 12L20 4L13 20L11 13L4 12Z"
            fill={canSend ? theme.textOnPrimary : theme.textMuted}
          />
        </Svg>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    maxHeight: 120,
    paddingTop: 8,
    paddingBottom: 8,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  send: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
