import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from "react-native";

import { Card } from "@/components/card";
import { Screen } from "@/components/screen";
import { ScreenHeader } from "@/components/screen-header";
import { ThemedText } from "@/components/themed-text";
import { Layout, Radius, Spacing } from "@/constants/theme";
import {
  CalendarDay,
  currentPrayer,
  fetchCalendar,
  fetchTimings,
  formatCountdown,
  Loc,
  nextPrayer,
  PrayerData,
} from "@/features/prayer/times";
import { formatTime } from "@/features/settings/settings";
import { useSettings } from "@/features/settings/settings-context";
import { SunArc } from "@/features/prayer/sun-arc";
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
      if (controller.signal.aborted) return;
      setToday(t);

      // Hijri view needs today's Hijri year/month; Gregorian uses the device date.
      const c =
        settings.calendar === "hijri" && t
          ? await fetchCalendar(loc, t.hijriYear, t.hijriMonth, "hijri", controller.signal)
          : await fetchCalendar(loc, d.getFullYear(), d.getMonth() + 1, "gregorian", controller.signal);
      if (!controller.signal.aborted) setCalendar(c);
    })();
    return () => controller.abort();
  }, [loc, settings.prayerMethod, settings.calendar]);

  const submitCity = () => {
    const parts = query.split(",").map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return;
    Haptics.selectionAsync();
    setDenied(false);
    setLabel(parts[0]);
    setLoc({ city: parts[0], country: parts[1] });
  };

  const next = today ? nextPrayer(today.prayers, now) : null;
  const current = today ? currentPrayer(today.prayers, now) : null;
  const rows = today
    ? DISPLAY_ORDER.map((name) => ({
        name,
        time: name === "Sunrise" ? today.sunrise : today.prayers.find((p) => p.name === name)!.time,
      }))
    : [];
  const isHijri = settings.calendar === "hijri" && !!today;
  const todayNum = isHijri ? String(today!.hijriDay) : String(now.getDate());
  const monthLabel = isHijri
    ? `${today!.hijriMonthName} ${today!.hijriYear}`
    : `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;

  // Both dates in the header: Gregorian · Islamic.
  const gregorianDate = `${MONTH_NAMES[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
  const dateSubtitle = today?.hijri ? `${gregorianDate}  ·  ${today.hijri} AH` : gregorianDate;

  return (
    <Screen scroll edges={["top", "left", "right"]} contentContainerStyle={styles.content}>
      <ScreenHeader eyebrow="PRAYER TIMES" title={label || "Prayer"} subtitle={dateSubtitle} />

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
        <Pressable
          onPress={submitCity}
          hitSlop={8}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
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
          {/* Sun's journey for the day */}
          <Card elevated>
            <SunArc sunrise={today.sunrise} sunset={today.sunset} now={now} />
          </Card>

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

          {/* Today's full list — the current prayer is marked "Now" */}
          <Card elevated list>
            {rows.map((r, i) => {
              const isCurrent = current === r.name;
              return (
                <View
                  key={r.name}
                  style={[
                    styles.timeRow,
                    i < rows.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth },
                  ]}
                >
                  <View style={styles.timeName}>
                    <ThemedText
                      type="bodyMedium"
                      style={{ color: isCurrent ? theme.primary : theme.text }}
                    >
                      {r.name}
                    </ThemedText>
                    {isCurrent ? (
                      <View style={[styles.nowTag, { backgroundColor: theme.accentSoft }]}>
                        <ThemedText type="caption" themeColor="accent">
                          Now
                        </ThemedText>
                      </View>
                    ) : null}
                  </View>
                  <ThemedText
                    type="bodyMedium"
                    style={{ color: isCurrent ? theme.primary : theme.textSecondary }}
                  >
                    {formatTime(r.time, settings.timeFormat)}
                  </ThemedText>
                </View>
              );
            })}
          </Card>

          {/* Monthly calendar */}
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setShowCal((s) => !s);
            }}
            style={({ pressed }) => [
              styles.calToggle,
              { borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
            ]}
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
  content: { gap: Layout.sectionGap },
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.lg,
  },
  timeName: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  nowTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.pill,
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
