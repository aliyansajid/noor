import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type ScreenHeaderProps = {
  /** Small uppercase label above the title (e.g. "VERSE OF THE DAY"). */
  eyebrow?: string;
  title: string;
  /** Muted line under the title (e.g. the Hijri date). */
  subtitle?: string;
  /** Optional element aligned to the right of the title row. */
  trailing?: ReactNode;
};

/** The one screen-title treatment used across all tabs, for consistency. */
export function ScreenHeader({ eyebrow, title, subtitle, trailing }: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      {eyebrow ? (
        <ThemedText type="caption" themeColor="accent" style={styles.eyebrow}>
          {eyebrow}
        </ThemedText>
      ) : null}
      <View style={styles.titleRow}>
        <ThemedText type="title" themeColor="text" style={styles.title}>
          {title}
        </ThemedText>
        {trailing}
      </View>
      {subtitle ? (
        <ThemedText type="small" themeColor="textMuted">
          {subtitle}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.xs },
  eyebrow: { letterSpacing: 1.5 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  title: { flexShrink: 1 },
});
