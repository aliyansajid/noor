import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { AyahCard } from "@/components/ayah-card";
import { Button } from "@/components/button";
import { Screen } from "@/components/screen";
import { ThemedText } from "@/components/themed-text";
import { FontFamily, Spacing } from "@/constants/theme";
import { reflectOnVerse } from "@/features/chat/ai";
import { TypingDots } from "@/features/chat/components/typing-dots";
import { Ayah } from "@/features/chat/types";
import { fetchDailyAyah } from "@/features/quran/verses";
import { useSettings } from "@/features/settings/settings-context";
import { useTheme } from "@/hooks/use-theme";

function formatDate(d: Date) {
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/** Stable per-day key so the reflection is generated once a day, not per open. */
function dayKey(d: Date) {
  return `noor.reflection.${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/** The daily verse: one hand-picked ayah per day with a short AI reflection. */
export default function Today() {
  const theme = useTheme();
  const router = useRouter();
  const { settings } = useSettings();
  const [ayah, setAyah] = useState<Ayah | null>(null);
  const [reflection, setReflection] = useState("");
  const [failed, setFailed] = useState(false);
  const dateLabel = useRef(formatDate(new Date())).current;

  // Re-fetch when the translation or reciter changes so the verse reflects the
  // user's chosen editions.
  useEffect(() => {
    const controller = new AbortController();
    setAyah(null);
    setReflection("");
    setFailed(false);
    (async () => {
      const now = new Date();
      const verse = await fetchDailyAyah(now, controller.signal);
      if (controller.signal.aborted) return;
      if (!verse) {
        setFailed(true);
        return;
      }
      setAyah(verse);

      // Reflection is stable for the day → cache it and skip the Gemini call
      // on subsequent opens. Keyed by day + verse + translation.
      const key = dayKey(now);
      try {
        const raw = await AsyncStorage.getItem(key);
        if (raw) {
          const c = JSON.parse(raw);
          if (c.reference === verse.reference && c.translation === settings.translation && c.text) {
            if (!controller.signal.aborted) setReflection(c.text);
            return;
          }
        }
      } catch {
        // cache miss / parse error — fall through and generate
      }

      const r = await reflectOnVerse(verse.reference, verse.translation, controller.signal);
      if (controller.signal.aborted) return;
      setReflection(r);
      if (r) {
        AsyncStorage.setItem(
          key,
          JSON.stringify({ reference: verse.reference, translation: settings.translation, text: r }),
        ).catch(() => {});
      }
    })();
    return () => controller.abort();
  }, [settings.translation, settings.reciter]);

  const askAboutVerse = () => {
    if (!ayah) return;
    router.navigate({
      pathname: "/chat",
      params: { prefill: `Help me reflect on ${ayah.reference}.` },
    });
  };

  return (
    <Screen scroll edges={["top", "left", "right"]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <ThemedText type="caption" themeColor="accent" style={styles.eyebrow}>
          VERSE OF THE DAY
        </ThemedText>
        <ThemedText type="title" themeColor="text">
          {dateLabel}
        </ThemedText>
      </View>

      {ayah ? (
        <>
          <AyahCard
            arabic={ayah.arabic}
            translation={ayah.translation}
            reference={ayah.reference}
            transliteration={ayah.transliteration}
            audio={ayah.audio}
          />

          <View style={styles.reflection}>
            <ThemedText type="caption" themeColor="accent" style={styles.eyebrow}>
              REFLECTION
            </ThemedText>
            {reflection ? (
              <ThemedText style={[styles.reflectionText, { color: theme.textSecondary }]}>
                {reflection}
              </ThemedText>
            ) : (
              <View style={styles.dots}>
                <TypingDots />
              </View>
            )}
          </View>

          <Button
            title="Reflect with Noor"
            variant="secondary"
            onPress={askAboutVerse}
            style={styles.cta}
          />
        </>
      ) : failed ? (
        <ThemedText type="body" themeColor="textSecondary" style={styles.state}>
          Couldn’t load today’s verse. Please check your connection and try again.
        </ThemedText>
      ) : (
        <View style={styles.state}>
          <ActivityIndicator color={theme.primary} />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: Spacing.xl },
  header: { gap: Spacing.xs },
  eyebrow: { letterSpacing: 1.5 },
  reflection: { gap: Spacing.sm },
  reflectionText: {
    fontFamily: FontFamily.serif,
    fontSize: 18,
    lineHeight: 28,
    fontStyle: "italic",
  },
  dots: { paddingVertical: Spacing.sm },
  cta: { marginTop: Spacing.sm },
  state: { paddingTop: Spacing.xxxl, alignItems: "center", textAlign: "center" },
});
