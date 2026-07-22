import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { AyahCard } from "@/components/ayah-card";
import { Button } from "@/components/button";
import { MosqueArt } from "@/components/mosque-art";
import { Screen } from "@/components/screen";
import { ThemedText } from "@/components/themed-text";
import { FontFamily, Layout, Radius, Spacing } from "@/constants/theme";
import { reflectOnVerse } from "@/features/chat/ai";
import { TypingDots } from "@/features/chat/components/typing-dots";
import { Ayah } from "@/features/chat/types";
import { PrayerIcon } from "@/features/prayer/prayer-icon";
import {
  currentPrayer,
  fetchTimings,
  formatCountdown,
  Loc,
  nextPrayer,
  PrayerData,
} from "@/features/prayer/times";
import { fetchDailyAyah } from "@/features/quran/verses";
import { formatTime } from "@/features/settings/settings";
import { useSettings } from "@/features/settings/settings-context";
import { useTheme } from "@/hooks/use-theme";

const STRIP = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// The hero is a night-emerald panel in both themes, so its text is fixed-light.
const HERO_BG = ["#12463A", "#0F3329", "#0C201A"] as const;
const HERO_INK = "#EDE9DF";
const HERO_MUTED = "#A7B0A9";
const EMERALD = "#3FA985";
const GOLD = "#E3C46B";

function reflectionKey(d: Date) {
  return `noor.reflection.${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/** Home — the landing hub: prayer hero, a way into asking, and today's verse. */
export default function Home() {
  const theme = useTheme();
  const router = useRouter();
  const { settings } = useSettings();

  const [now, setNow] = useState(() => new Date());
  const [loc, setLoc] = useState<Loc | null>(null);
  const [prayer, setPrayer] = useState<PrayerData | null>(null);
  const [ayah, setAyah] = useState<Ayah | null>(null);
  const [reflection, setReflection] = useState("");

  // Keep the countdown / current-prayer highlight fresh.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Resolve GPS once for the prayer hero (best-effort; hero degrades gracefully).
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        let perm = await Location.getForegroundPermissionsAsync();
        if (!perm.granted) perm = await Location.requestForegroundPermissionsAsync();
        if (!perm.granted) return;
        const pos =
          (await Location.getLastKnownPositionAsync()) ??
          (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
        if (!active) return;
        setLoc({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      } catch {
        // no location — hero shows date + verse only
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Today's prayer times for the hero.
  useEffect(() => {
    if (!loc) return;
    const controller = new AbortController();
    (async () => {
      const t = await fetchTimings(loc, new Date(), controller.signal);
      if (!controller.signal.aborted) setPrayer(t);
    })();
    return () => controller.abort();
  }, [loc, settings.prayerMethod]);

  // The daily verse + its cached AI reflection.
  useEffect(() => {
    const controller = new AbortController();
    setAyah(null);
    setReflection("");
    (async () => {
      const d = new Date();
      const verse = await fetchDailyAyah(d, controller.signal);
      if (controller.signal.aborted || !verse) return;
      setAyah(verse);

      const key = reflectionKey(d);
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
        // fall through and generate
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

  const next = prayer ? nextPrayer(prayer.prayers, now) : null;
  const current = prayer ? currentPrayer(prayer.prayers, now) : null;
  const stripRows = prayer
    ? STRIP.map((n) => ({ name: n, time: prayer.prayers.find((p) => p.name === n)!.time }))
    : [];

  const gregDate = `${MONTH_NAMES[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
  const dateLine = prayer?.hijri ? `${gregDate}  ·  ${prayer.hijri} AH` : gregDate;

  const reflectOnToday = () => {
    if (!ayah) return;
    router.navigate({ pathname: "/chat", params: { prefill: `Help me reflect on ${ayah.reference}.` } });
  };

  return (
    <Screen scroll edges={["top", "left", "right"]} contentContainerStyle={styles.content}>
      {/* PRAYER HERO */}
      <LinearGradient colors={HERO_BG} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.hero}>
        <View style={styles.motif} pointerEvents="none">
          <MosqueArt color={GOLD} opacity={0.1} width={230} height={190} align="xMaxYMax meet" />
        </View>

        <ThemedText type="caption" style={styles.dateLine}>
          {dateLine}
        </ThemedText>

        {next ? (
          <>
            <View style={styles.countRow}>
              <ThemedText type="title" style={{ color: EMERALD }}>
                {next.name}
              </ThemedText>
              <ThemedText type="label" style={{ color: GOLD }}>
                in {formatCountdown(next.minutesUntil)}
              </ThemedText>
            </View>
            <ThemedText type="small" style={{ color: HERO_MUTED }}>
              {formatTime(next.time, settings.timeFormat)} — the next prayer
            </ThemedText>
          </>
        ) : (
          <ThemedText type="small" style={[styles.heroNote, { color: HERO_MUTED }]}>
            Enable location on the Prayer tab to see today’s prayer times.
          </ThemedText>
        )}

        {stripRows.length ? (
          <View style={styles.strip}>
            {stripRows.map((r) => {
              const on = current === r.name;
              return (
                <View key={r.name} style={styles.stripItem}>
                  <PrayerIcon name={r.name} color={on ? GOLD : HERO_MUTED} />
                  <ThemedText type="caption" style={{ color: on ? GOLD : HERO_MUTED, marginTop: 4 }}>
                    {r.name}
                  </ThemedText>
                  <ThemedText type="caption" style={{ color: on ? GOLD : HERO_INK, fontFamily: FontFamily.semibold }}>
                    {formatTime(r.time, settings.timeFormat)}
                  </ThemedText>
                  {on ? <View style={styles.stripDot} /> : null}
                </View>
              );
            })}
          </View>
        ) : null}
      </LinearGradient>

      {/* VERSE OF THE DAY */}
      <View style={styles.verseHead}>
        <ThemedText type="subtitle" themeColor="text">
          Verse of the day
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
          <Button title="Reflect with Noor" variant="secondary" onPress={reflectOnToday} />
        </>
      ) : (
        <View style={styles.verseLoading}>
          <ActivityIndicator color={theme.primary} />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: Layout.sectionGap },

  hero: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    overflow: "hidden",
    gap: 2,
  },
  motif: { position: "absolute", right: -42, bottom: 0 },
  dateLine: { color: "#E3C46B", letterSpacing: 0.3 },
  countRow: { flexDirection: "row", alignItems: "baseline", gap: Spacing.sm, marginTop: 2 },
  heroNote: { marginTop: Spacing.sm },
  strip: { flexDirection: "row", justifyContent: "space-between", marginTop: Spacing.lg },
  stripItem: { flex: 1, alignItems: "center", gap: 1, position: "relative" },
  stripDot: {
    position: "absolute",
    bottom: -8,
    width: 16,
    height: 2,
    borderRadius: 2,
    backgroundColor: "#E3C46B",
  },

  verseHead: { marginTop: Spacing.xs },
  verseLoading: { paddingVertical: Spacing.xxl, alignItems: "center" },
  reflection: { gap: Spacing.sm },
  eyebrow: { letterSpacing: 1.5 },
  reflectionText: { fontFamily: FontFamily.serif, fontSize: 18, lineHeight: 28, fontStyle: "italic" },
  dots: { paddingVertical: Spacing.sm },
});
