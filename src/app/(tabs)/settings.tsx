import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { Card } from "@/components/card";
import { Screen } from "@/components/screen";
import { ScreenHeader } from "@/components/screen-header";
import { ThemedText } from "@/components/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { useSettings } from "@/features/settings/settings-context";
import { CalendarSystem, ThemePref, TimeFormat } from "@/features/settings/settings";
import { useTheme } from "@/hooks/use-theme";

export default function Settings() {
  const theme = useTheme();
  const router = useRouter();
  const { settings, update } = useSettings();

  return (
    <Screen scroll edges={["top", "left", "right"]} contentContainerStyle={styles.content}>
      <ScreenHeader title="Settings" />

      <SectionTitle>APPEARANCE</SectionTitle>
      <Card elevated>
        <FieldLabel>Theme</FieldLabel>
        <Segmented<ThemePref>
          value={settings.theme}
          onChange={(v) => update({ theme: v })}
          options={[
            { label: "System", value: "system" },
            { label: "Light", value: "light" },
            { label: "Dark", value: "dark" },
          ]}
        />
        <View style={styles.gap} />
        <FieldLabel>Time format</FieldLabel>
        <Segmented<TimeFormat>
          value={settings.timeFormat}
          onChange={(v) => update({ timeFormat: v })}
          options={[
            { label: "24-hour", value: "24h" },
            { label: "12-hour", value: "12h" },
          ]}
        />
      </Card>

      <SectionTitle>READING</SectionTitle>
      <Card elevated list>
        <NavRow
          label="Translation"
          value={settings.translationName}
          onPress={() => router.push({ pathname: "/edition-picker", params: { field: "translation" } })}
        />
        <Divider />
        <NavRow
          label="Reciter"
          value={settings.reciterName}
          onPress={() => router.push({ pathname: "/edition-picker", params: { field: "reciter" } })}
        />
        <Divider />
        <NavRow
          label="Tafsir"
          value={settings.tafsirName}
          onPress={() => router.push({ pathname: "/edition-picker", params: { field: "tafsir" } })}
        />
        <Divider />
        <NavRow
          label="Arabic script"
          value={settings.arabicEditionName}
          onPress={() => router.push({ pathname: "/edition-picker", params: { field: "arabic" } })}
        />
      </Card>

      <SectionTitle>PRAYER</SectionTitle>
      <Card elevated>
        <FieldLabel>Calendar</FieldLabel>
        <Segmented<CalendarSystem>
          value={settings.calendar}
          onChange={(v) => update({ calendar: v })}
          options={[
            { label: "Gregorian", value: "gregorian" },
            { label: "Hijri", value: "hijri" },
          ]}
        />
      </Card>

    </Screen>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <ThemedText type="caption" themeColor="accent" style={styles.sectionTitle}>
      {children}
    </ThemedText>
  );
}

function FieldLabel({ children }: { children: string }) {
  return (
    <ThemedText type="label" themeColor="textSecondary" style={styles.fieldLabel}>
      {children}
    </ThemedText>
  );
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { label: string; value: T }[];
}) {
  const theme = useTheme();
  return (
    <View style={[styles.segment, { backgroundColor: theme.background }]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => {
              Haptics.selectionAsync();
              onChange(o.value);
            }}
            style={({ pressed }) => [
              styles.segmentItem,
              active && { backgroundColor: theme.primary },
              pressed && !active && { opacity: 0.7 },
            ]}
          >
            <ThemedText
              type="label"
              style={{ color: active ? theme.textOnPrimary : theme.textSecondary }}
            >
              {o.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

function NavRow({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [styles.navRow, { opacity: pressed ? 0.7 : 1 }]}
    >
      <ThemedText type="bodyMedium" themeColor="text">
        {label}
      </ThemedText>
      <View style={styles.navRight}>
        <ThemedText type="body" themeColor="textSecondary" numberOfLines={1} style={styles.navValue}>
          {value}
        </ThemedText>
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path d="M9 18l6-6-6-6" stroke={theme.textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </View>
    </Pressable>
  );
}

function Divider() {
  const theme = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.border }} />;
}

const styles = StyleSheet.create({
  content: { gap: Spacing.sm },
  sectionTitle: { letterSpacing: 1.5, marginTop: Spacing.lg, marginBottom: Spacing.xs },
  fieldLabel: { marginBottom: Spacing.sm },
  gap: { height: Spacing.lg },
  segment: { flexDirection: "row", borderRadius: Radius.md, padding: 4, gap: 4 },
  segmentItem: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    alignItems: "center",
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.lg,
  },
  navRight: { flexDirection: "row", alignItems: "center", gap: Spacing.xs, flexShrink: 1, marginLeft: Spacing.lg },
  navValue: { flexShrink: 1 },
});
