import { StyleSheet, View } from 'react-native';

import { AyahCard } from '@/components/ayah-card';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const SWATCHES: { name: string; color: string }[] = [
  { name: 'Emerald', color: Palette.emerald },
  { name: 'Deep', color: Palette.emeraldDeep },
  { name: 'Gold', color: Palette.gold },
  { name: 'Ivory', color: Palette.ivory },
  { name: 'Night', color: Palette.night },
];

export default function StyleShowcase() {
  const theme = useTheme();

  return (
    <Screen scroll>
      <View style={styles.header}>
        <ThemedText type="display" themeColor="primary">
          Noor
        </ThemedText>
        <ThemedText type="subtitle" themeColor="textSecondary">
          Ask the Qur'an
        </ThemedText>
      </View>

      <Section title="Type scale">
        <Card>
          <ThemedText type="display">Display</ThemedText>
          <ThemedText type="title">Title serif</ThemedText>
          <ThemedText type="heading">Heading</ThemedText>
          <ThemedText type="subtitle">Subtitle</ThemedText>
          <ThemedText type="body">Body — Plus Jakarta Sans, the workhorse UI font.</ThemedText>
          <ThemedText type="caption" themeColor="textMuted">
            CAPTION / META
          </ThemedText>
        </Card>
      </Section>

      <Section title="Palette">
        <View style={styles.swatchRow}>
          {SWATCHES.map((s) => (
            <View key={s.name} style={styles.swatch}>
              <View style={[styles.swatchDot, { backgroundColor: s.color, borderColor: theme.border }]} />
              <ThemedText type="caption" themeColor="textMuted">
                {s.name}
              </ThemedText>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Ayah card">
        <AyahCard
          reference="Al-Baqarah 2:286"
          arabic="لَا يُكَلِّفُ ٱللَّهُ نَفْسًا إِلَّا وُسْعَهَا"
          transliteration="Lā yukallifu llāhu nafsan illā wusʿahā"
          translation="Allah does not burden a soul beyond that it can bear."
        />
      </Section>

      <Section title="Buttons">
        <View style={{ gap: Spacing.md }}>
          <Button title="Start a conversation" variant="primary" />
          <Button title="Daily verse" variant="secondary" />
          <Button title="Learn more" variant="ghost" />
        </View>
      </Section>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText type="label" themeColor="textMuted" style={styles.sectionLabel}>
        {title.toUpperCase()}
      </ThemedText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  sectionLabel: {
    letterSpacing: 1.5,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  swatch: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  swatchDot: {
    width: 48,
    height: 48,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
});
