import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AyahCardProps = {
  arabic: string;
  translation: string;
  reference: string; // e.g. "Al-Baqarah 2:286"
  transliteration?: string;
};

/** Renders a Qur'anic ayah: Arabic (RTL, Uthmanic/Amiri), translation, and reference. */
export function AyahCard({ arabic, translation, reference, transliteration }: AyahCardProps) {
  const theme = useTheme();

  return (
    <Card elevated>
      <View style={[styles.badge, { backgroundColor: theme.primarySoft }]}>
        <ThemedText type="caption" themeColor="accent">
          {reference}
        </ThemedText>
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

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.pill,
    marginBottom: Spacing.lg,
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
