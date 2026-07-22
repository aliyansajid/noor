import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AyahCardProps = {
  arabic: string;
  translation: string;
  reference: string; // e.g. "Al-Baqarah 2:286"
  transliteration?: string;
  audio?: string; // recitation MP3
};

/** Renders a Qur'anic ayah: Arabic (RTL, Uthmanic/Amiri), translation, reference,
 * and — when a recitation is available — a play/pause control. */
export function AyahCard({ arabic, translation, reference, transliteration, audio }: AyahCardProps) {
  const theme = useTheme();

  return (
    <Card elevated>
      <View style={styles.topRow}>
        <View style={[styles.badge, { backgroundColor: theme.primarySoft }]}>
          <ThemedText type="caption" themeColor="accent">
            {reference}
          </ThemedText>
        </View>
        {audio ? <ReciteButton uri={audio} /> : null}
      </View>

      <ThemedText style={[Typography.ayah, styles.arabic, { color: theme.text }]}>
        {arabic}
      </ThemedText>

      {transliteration ? (
        <ThemedText type="small" themeColor="textMuted" style={styles.transliteration}>
          {transliteration}
        </ThemedText>
      ) : null}

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      <ThemedText type="body" themeColor="textSecondary">
        {translation}
      </ThemedText>
    </Card>
  );
}

/** Circular play/pause button that streams a recitation MP3. */
function ReciteButton({ uri }: { uri: string }) {
  const theme = useTheme();
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);
  const loading = status.isBuffering && !status.playing;

  const toggle = () => {
    Haptics.selectionAsync();
    if (status.playing) {
      player.pause();
      return;
    }
    // Replay from the top if it had finished.
    if (status.didJustFinish || (status.duration > 0 && status.currentTime >= status.duration)) {
      player.seekTo(0);
    }
    player.play();
  };

  return (
    <Pressable
      onPress={toggle}
      hitSlop={8}
      style={({ pressed }) => [
        styles.reciteBtn,
        { backgroundColor: theme.primarySoft, opacity: pressed ? 0.7 : 1 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={status.playing ? 'Pause recitation' : 'Play recitation'}
    >
      {loading ? (
        <ActivityIndicator size="small" color={theme.primary} />
      ) : status.playing ? (
        <Svg width={16} height={16} viewBox="0 0 24 24">
          <Rect x={6} y={5} width={4} height={14} rx={1} fill={theme.primary} />
          <Rect x={14} y={5} width={4} height={14} rx={1} fill={theme.primary} />
        </Svg>
      ) : (
        <Svg width={16} height={16} viewBox="0 0 24 24">
          <Path d="M8 5.5v13a1 1 0 0 0 1.5.87l11-6.5a1 1 0 0 0 0-1.74l-11-6.5A1 1 0 0 0 8 5.5Z" fill={theme.primary} />
        </Svg>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.pill,
  },
  reciteBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arabic: {
    writingDirection: 'rtl',
    textAlign: 'right',
    fontFamily: FontFamily.arabic,
  },
  transliteration: {
    marginTop: Spacing.md,
    fontStyle: 'italic',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: Spacing.lg,
  },
});
