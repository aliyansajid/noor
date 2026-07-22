import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { ScreenGlow } from "@/components/screen-glow";
import { Skeleton } from "@/components/skeleton";
import { ThemedText } from "@/components/themed-text";
import { Layout, Spacing } from "@/constants/theme";
import {
  Edition,
  fetchArabicScripts,
  fetchReciters,
  fetchTafsirs,
  fetchTranslations,
  languageName,
} from "@/features/quran/editions";
import { Settings } from "@/features/settings/settings";
import { useSettings } from "@/features/settings/settings-context";
import { useTheme } from "@/hooks/use-theme";

type FieldConfig = {
  title: string;
  fetch: (signal?: AbortSignal) => Promise<Edition[]>;
  idKey: keyof Settings;
  nameKey: keyof Settings;
  grouped: boolean; // group by language (translations only)
};

const FIELDS: Record<string, FieldConfig> = {
  translation: { title: "Translation", fetch: fetchTranslations, idKey: "translation", nameKey: "translationName", grouped: true },
  reciter: { title: "Reciter", fetch: fetchReciters, idKey: "reciter", nameKey: "reciterName", grouped: false },
  tafsir: { title: "Tafsir", fetch: fetchTafsirs, idKey: "tafsir", nameKey: "tafsirName", grouped: false },
  arabic: { title: "Arabic script", fetch: fetchArabicScripts, idKey: "arabicEdition", nameKey: "arabicEditionName", grouped: false },
};

/** Full-screen list to choose an edition (translation / reciter / tafsir /
 * Arabic script) from the Al-Quran Cloud catalog. */
export default function EditionPicker() {
  const theme = useTheme();
  const router = useRouter();
  const { field } = useLocalSearchParams<{ field: string }>();
  const cfg = FIELDS[field ?? "translation"] ?? FIELDS.translation;
  const { settings, update } = useSettings();
  const currentId = settings[cfg.idKey];

  const [editions, setEditions] = useState<Edition[] | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setEditions(null);
    cfg.fetch(controller.signal).then((list) => {
      if (!controller.signal.aborted) setEditions(list);
    });
    return () => controller.abort();
  }, [cfg]);

  // Translations: grouped by language, English first. Others: one flat group.
  const groups = useMemo(() => {
    if (!editions) return [];
    if (!cfg.grouped) {
      const items = [...editions].sort((a, b) =>
        (a.englishName || a.name).localeCompare(b.englishName || b.name),
      );
      return [{ title: "", items }];
    }
    const byLang: Record<string, Edition[]> = {};
    for (const e of editions) (byLang[e.language] ??= []).push(e);
    return Object.keys(byLang)
      .sort((a, b) =>
        a === "en" ? -1 : b === "en" ? 1 : languageName(a).localeCompare(languageName(b)),
      )
      .map((lang) => ({
        title: languageName(lang),
        items: byLang[lang].sort((x, y) =>
          (x.englishName || x.name).localeCompare(y.englishName || y.name),
        ),
      }));
  }, [editions, cfg]);

  const select = (e: Edition) => {
    Haptics.selectionAsync();
    const name = e.englishName || e.name;
    update({ [cfg.idKey]: e.identifier, [cfg.nameKey]: name } as Partial<Settings>);
    router.back();
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={["top"]}>
      <ScreenGlow />
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={({ pressed }) => [styles.back, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path d="M15 18l-6-6 6-6" stroke={theme.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Pressable>
        <ThemedText type="subtitle" themeColor="text">
          {cfg.title}
        </ThemedText>
        <View style={styles.back} />
      </View>

      {!editions ? (
        <View style={styles.content}>
          {Array.from({ length: 8 }).map((_, i) => (
            <View key={i} style={[styles.row, { borderBottomColor: theme.border }]}>
              <View style={[styles.rowText, { gap: 6 }]}>
                <Skeleton width={180} height={16} />
                <Skeleton width={110} height={12} />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {groups.map((g) => (
            <View key={g.title || "all"}>
              {g.title ? (
                <ThemedText type="caption" themeColor="accent" style={styles.groupTitle}>
                  {g.title.toUpperCase()}
                </ThemedText>
              ) : null}
              {g.items.map((e) => {
                const active = e.identifier === currentId;
                return (
                  <Pressable
                    key={e.identifier}
                    onPress={() => select(e)}
                    style={({ pressed }) => [
                      styles.row,
                      { borderBottomColor: theme.border, opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <View style={styles.rowText}>
                      <ThemedText
                        type="bodyMedium"
                        style={{ color: active ? theme.primary : theme.text }}
                      >
                        {e.englishName || e.name}
                      </ThemedText>
                      {e.name && e.name !== (e.englishName || "") ? (
                        <ThemedText
                          type="small"
                          themeColor="textMuted"
                          numberOfLines={1}
                          style={styles.subName}
                        >
                          {e.name}
                        </ThemedText>
                      ) : null}
                    </View>
                    {active ? (
                      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                        <Path d="M20 6L9 17l-5-5" stroke={theme.primary} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
                      </Svg>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  back: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: Layout.screenPadding, paddingBottom: Spacing.xxxl },
  groupTitle: { letterSpacing: 1.5, marginTop: Spacing.xl, marginBottom: Spacing.xs },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.md,
  },
  rowText: { flexShrink: 1, gap: 2 },
  // Arabic names carry diacritics and tall combined glyphs (ك, lam-alef) that
  // exceed the Latin line box; give the line generous room so tops aren't clipped.
  subName: { lineHeight: 28 },
});
