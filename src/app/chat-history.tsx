import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { ScreenGlow } from "@/components/screen-glow";
import { Skeleton } from "@/components/skeleton";
import { ThemedText } from "@/components/themed-text";
import { Layout, Spacing } from "@/constants/theme";
import {
  ConversationSummary,
  deleteConversation,
  listConversations,
} from "@/features/chat/history";
import { useTheme } from "@/hooks/use-theme";

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

/** Past conversations — tap to resume, or delete. */
export default function ChatHistory() {
  const theme = useTheme();
  const router = useRouter();
  const [items, setItems] = useState<ConversationSummary[] | null>(null);

  useEffect(() => {
    let active = true;
    listConversations().then((list) => {
      if (active) setItems(list);
    });
    return () => {
      active = false;
    };
  }, []);

  const open = (id: string) => {
    Haptics.selectionAsync();
    router.navigate({ pathname: "/chat", params: { load: id } });
  };

  const remove = (id: string) => {
    Haptics.selectionAsync();
    setItems((prev) => prev?.filter((c) => c.id !== id) ?? prev);
    deleteConversation(id);
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
          History
        </ThemedText>
        <View style={styles.back} />
      </View>

      {!items ? (
        <View style={styles.content}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={i} style={[styles.row, { borderBottomColor: theme.border }]}>
              <View style={{ gap: 6, flex: 1 }}>
                <Skeleton width="70%" height={16} />
                <Skeleton width={80} height={12} />
              </View>
            </View>
          ))}
        </View>
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <ThemedText type="body" themeColor="textMuted" style={{ textAlign: "center" }}>
            No conversations yet. Your chats will appear here.
          </ThemedText>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {items.map((c) => (
            <View key={c.id} style={[styles.row, { borderBottomColor: theme.border }]}>
              <Pressable style={styles.rowMain} onPress={() => open(c.id)}>
                <ThemedText type="bodyMedium" themeColor="text" numberOfLines={1}>
                  {c.title}
                </ThemedText>
                <ThemedText type="small" themeColor="textMuted">
                  {relativeTime(c.updatedAt)}
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={() => remove(c.id)}
                hitSlop={10}
                accessibilityLabel="Delete conversation"
                style={({ pressed }) => [styles.trash, { opacity: pressed ? 0.6 : 1 }]}
              >
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"
                    stroke={theme.textMuted}
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </Pressable>
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
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: Spacing.xxl },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.md,
  },
  rowMain: { flex: 1, gap: 2 },
  trash: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
});
