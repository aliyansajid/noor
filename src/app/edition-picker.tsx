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
import { Edition, fetchReciters, fetchTranslations, languageName } from "@/features/quran/editions";
import { useSettings } from "@/features/settings/settings-context";
import { useTheme } from "@/hooks/use-theme";

/** Full-screen list to choose a translation or reciter from the API catalog. */
export default function EditionPicker() {
  const theme = useTheme();
  const router = useRouter();
  const { field } = useLocalSearchParams<{ field: string }>();
  const isTranslation = field === "translation";
  const { settings, update } = useSettings();
  const currentId = isTranslation ? settings.translation : settings.reciter;

  const [editions, setEditions] = useState<Edition[] | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    (isTranslation ? fetchTranslations : fetchReciters)(controller.signal).then((list) => {
      if (!controller.signal.aborted) setEditions(list);
    });
    return () => controller.abort();
  }, [isTranslation]);

  // Translations: grouped by language, English first. Reciters: one flat group.
  const groups = useMemo(() => {
    if (!editions) return [];
    if (!isTranslation) {
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
  }, [editions, isTranslation]);

  const select = (e: Edition) => {
    Haptics.selectionAsync();
    const name = e.englishName || e.name;
    if (isTranslation) update({ translation: e.identifier, translationName: name });
    else update({ reciter: e.identifier, reciterName: name });
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
          {isTranslation ? "Translation" : "Reciter"}
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
                        <ThemedText type="small" themeColor="textMuted" numberOfLines={1}>
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
});
