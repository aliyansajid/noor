import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from "react-native";

import { Card } from "@/components/card";
import { Screen } from "@/components/screen";
import { ThemedText } from "@/components/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import {
  CalendarDay,
  fetchCalendar,
  fetchTimings,
  formatCountdown,
  Loc,
  nextPrayer,
  PrayerData,
} from "@/features/prayer/times";
import { formatTime } from "@/features/settings/settings";
import { useSettings } from "@/features/settings/settings-context";
import { useTheme } from "@/hooks/use-theme";

const DISPLAY_ORDER = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Prayer tab: today's times + next-prayer countdown, a monthly calendar, and
 * a city override for when GPS isn't right (or is denied). */
export default function Prayer() {
  const theme = useTheme();
  const { settings } = useSettings();
  const [loc, setLoc] = useState<Loc | null>(null);
  const [label, setLabel] = useState("");
  const [denied, setDenied] = useState(false);
  const [today, setToday] = useState<PrayerData | null>(null);
  const [calendar, setCalendar] = useState<CalendarDay[] | null>(null);
  const [showCal, setShowCal] = useState(false);
  const [query, setQuery] = useState("");
  const [now, setNow] = useState(() => new Date());

  // Keep the countdown / next-prayer highlight fresh.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Resolve GPS once on mount (city search can override later).
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (!perm.granted) {
          if (active) setDenied(true);
          return;
        }
        const pos =
          (await Location.getLastKnownPositionAsync()) ??
          (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
        if (!active) return;
        const { latitude, longitude } = pos.coords;
        setLoc({ latitude, longitude });
        try {
          const g = await Location.reverseGeocodeAsync({ latitude, longitude });
          if (active) setLabel(g[0]?.city ?? g[0]?.region ?? "Your location");
        } catch {
          // city label is optional
        }
      } catch {
        if (active) setDenied(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Fetch today's times + this month's calendar whenever the location changes.
  useEffect(() => {
    if (!loc) return;
    const controller = new AbortController();
    setToday(null);
    setCalendar(null);
    (async () => {
      const d = new Date();
      const t = await fetchTimings(loc, d, controller.signal);
      if (!controller.signal.aborted) setToday(t);
      const c = await fetchCalendar(loc, d.getFullYear(), d.getMonth() + 1, controller.signal);
      if (!controller.signal.aborted) setCalendar(c);
    })();
    return () => controller.abort();
  }, [loc, settings.prayerMethod]);

  const submitCity = () => {
    const parts = query.split(",").map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return;
    setDenied(false);
    setLabel(parts[0]);
    setLoc({ city: parts[0], country: parts[1] });
  };

  const next = today ? nextPrayer(today.prayers, now) : null;
  const rows = today
    ? DISPLAY_ORDER.map((name) => ({
        name,
        time: name === "Sunrise" ? today.sunrise : today.prayers.find((p) => p.name === name)!.time,
      }))
    : [];
  const todayNum = String(now.getDate());
  const monthLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;

  return (
    <Screen scroll edges={["top", "left", "right"]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <ThemedText type="caption" themeColor="accent" style={styles.eyebrow}>
          PRAYER TIMES
        </ThemedText>
        <ThemedText type="title" themeColor="text">
          {label || "Prayer"}
        </ThemedText>
        {today?.hijri ? (
          <ThemedText type="small" themeColor="textMuted">
            {today.hijri} AH
          </ThemedText>
        ) : null}
      </View>

      {/* City override */}
      <View style={[styles.search, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={submitCity}
          placeholder="Search city, e.g. Karachi, Pakistan"
          placeholderTextColor={theme.textMuted}
          returnKeyType="search"
          style={[styles.input, { color: theme.text }]}
        />
        <Pressable onPress={submitCity} hitSlop={8}>
          <ThemedText type="label" themeColor="primary">
            Set
          </ThemedText>
        </Pressable>
      </View>

      {denied && !loc ? (
        <ThemedText type="body" themeColor="textSecondary" style={styles.note}>
          Location is off. Search a city above to see its prayer times.
        </ThemedText>
      ) : !today ? (
        <View style={styles.loading}>
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : (
        <>
          {/* Next prayer hero */}
          {next ? (
            <Card elevated>
              <ThemedText type="caption" themeColor="textMuted" style={styles.eyebrow}>
                NEXT PRAYER
              </ThemedText>
              <View style={styles.heroRow}>
                <ThemedText type="display" themeColor="primary">
                  {next.name}
                </ThemedText>
                <View style={styles.heroRight}>
                  <ThemedText type="heading" themeColor="text">
                    {formatTime(next.time, settings.timeFormat)}
                  </ThemedText>
                  <ThemedText type="small" themeColor="accent">
                    in {formatCountdown(next.minutesUntil)}
                  </ThemedText>
                </View>
              </View>
            </Card>
          ) : null}

          {/* Today's full list */}
          <Card elevated>
            {rows.map((r, i) => {
              const isNext = next?.name === r.name;
              return (
                <View
                  key={r.name}
                  style={[
                    styles.timeRow,
                    i < rows.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth },
                  ]}
                >
                  <ThemedText
                    type="bodyMedium"
                    style={{ color: isNext ? theme.primary : theme.text }}
                  >
                    {r.name}
                  </ThemedText>
                  <ThemedText
                    type="bodyMedium"
                    style={{ color: isNext ? theme.primary : theme.textSecondary }}
                  >
                    {formatTime(r.time, settings.timeFormat)}
                  </ThemedText>
                </View>
              );
            })}
          </Card>

          {/* Monthly calendar */}
          <Pressable
            onPress={() => setShowCal((s) => !s)}
            style={[styles.calToggle, { borderColor: theme.border }]}
          >
            <ThemedText type="label" themeColor="primary">
              {showCal ? "Hide" : "This month"} · {monthLabel}
            </ThemedText>
          </Pressable>

          {showCal ? (
            calendar ? (
              <CalendarTable calendar={calendar} todayNum={todayNum} />
            ) : (
              <View style={styles.loading}>
                <ActivityIndicator color={theme.primary} />
              </View>
            )
          ) : null}
        </>
      )}
    </Screen>
  );
}

const COLS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

function CalendarTable({ calendar, todayNum }: { calendar: CalendarDay[]; todayNum: string }) {
  const theme = useTheme();
  const { settings } = useSettings();
  return (
    <View>
      {/* header */}
      <View style={[styles.calRow, { borderBottomColor: theme.borderStrong, borderBottomWidth: 1 }]}>
        <ThemedText type="caption" themeColor="textMuted" style={styles.calDayCol}>
          Day
        </ThemedText>
        {COLS.map((c) => (
          <ThemedText key={c} type="caption" themeColor="textMuted" style={styles.calCol}>
            {c}
          </ThemedText>
        ))}
      </View>
      {calendar.map((d) => {
        const isToday = String(Number(d.day)) === todayNum;
        return (
          <View
            key={d.day}
            style={[
              styles.calRow,
              { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth },
              isToday && { backgroundColor: theme.primarySoft },
            ]}
          >
            <ThemedText
              type="caption"
              style={[styles.calDayCol, { color: isToday ? theme.primary : theme.textSecondary }]}
            >
              {Number(d.day)} {d.weekday.slice(0, 3)}
            </ThemedText>
            {COLS.map((c) => (
              <ThemedText
                key={c}
                type="caption"
                style={[styles.calCol, { color: isToday ? theme.primary : theme.text }]}
              >
                {formatTime(d.prayers.find((p) => p.name === c)?.time ?? "", settings.timeFormat)}
              </ThemedText>
            ))}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: Spacing.lg },
  header: { gap: Spacing.xs },
  eyebrow: { letterSpacing: 1.5 },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  input: { flex: 1, fontSize: 15, paddingVertical: Spacing.xs },
  note: { paddingVertical: Spacing.lg },
  loading: { paddingVertical: Spacing.xxl, alignItems: "center" },
  heroRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
  },
  heroRight: { alignItems: "flex-end" },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
  },
  calToggle: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  calRow: { flexDirection: "row", alignItems: "center", paddingVertical: Spacing.sm },
  calDayCol: { flex: 1, textAlign: "center" },
  calCol: { flex: 1, textAlign: "center" },
});
