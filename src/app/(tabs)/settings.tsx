import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
// (tab screen — no back button)

import { Card } from "@/components/card";
import { ThemedText } from "@/components/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { PRAYER_METHODS } from "@/features/quran/editions";
import { useSettings } from "@/features/settings/settings-context";
import { ThemePref, TimeFormat } from "@/features/settings/settings";
import { useTheme } from "@/hooks/use-theme";

export default function Settings() {
  const theme = useTheme();
  const router = useRouter();
  const { settings, update } = useSettings();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={["top"]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <ThemedText type="subtitle" themeColor="text">
          Settings
        </ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
        <Card elevated>
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
        </Card>

        <SectionTitle>PRAYER</SectionTitle>
        <Card elevated>
          <FieldLabel>Calculation method</FieldLabel>
          {PRAYER_METHODS.map((m, i) => {
            const active = settings.prayerMethod === m.id;
            return (
              <Pressable
                key={m.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  update({ prayerMethod: m.id });
                }}
                style={[
                  styles.methodRow,
                  i < PRAYER_METHODS.length - 1 && {
                    borderBottomColor: theme.border,
                    borderBottomWidth: StyleSheet.hairlineWidth,
                  },
                ]}
              >
                <ThemedText type="body" style={{ color: active ? theme.primary : theme.text }}>
                  {m.name}
                </ThemedText>
                {active ? <Check color={theme.primary} /> : null}
              </Pressable>
            );
          })}
        </Card>

        <ThemedText type="caption" themeColor="textMuted" style={styles.footer}>
          Qur’an data by Al-Quran Cloud · Prayer times by AlAdhan
        </ThemedText>
      </ScrollView>
    </SafeAreaView>
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
            style={[styles.segmentItem, active && { backgroundColor: theme.primary }]}
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
    <Pressable onPress={onPress} style={styles.navRow}>
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

function Check({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function Divider() {
  const theme = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.border }} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  back: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  content: { padding: Spacing.xl, gap: Spacing.sm, paddingBottom: Spacing.xxxl },
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
    paddingVertical: Spacing.md,
  },
  navRight: { flexDirection: "row", alignItems: "center", gap: Spacing.xs, flexShrink: 1, marginLeft: Spacing.lg },
  navValue: { flexShrink: 1 },
  methodRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
  },
  footer: { textAlign: "center", marginTop: Spacing.xl },
});
