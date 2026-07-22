import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { Spacing } from "@/constants/theme";
import { streamAnswer, StreamHandle } from "@/features/chat/ai";
import { ChatInput } from "@/features/chat/components/chat-input";
import { EmptyState } from "@/features/chat/components/empty-state";
import { MessageBubble } from "@/features/chat/components/message-bubble";
import { ChatMessage } from "@/features/chat/types";
import { useTheme } from "@/hooks/use-theme";

export default function Chat() {
  const theme = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const handleRef = useRef<StreamHandle | null>(null);
  const idRef = useRef(0);
  const nextId = () => `m${idRef.current++}`;

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() =>
      scrollRef.current?.scrollToEnd({ animated: true }),
    );
  }, []);

  const send = useCallback((text: string) => {
    handleRef.current?.cancel();
    const assistantId = nextId();
    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: "user", text },
      { id: assistantId, role: "assistant", text: "", pending: true },
    ]);
    setStreaming(true);

    handleRef.current = streamAnswer(text, {
      onText: (full) =>
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, text: full } : m)),
        ),
      onAyat: (ayat) =>
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, ayat } : m)),
        ),
      onDone: () => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, pending: false } : m,
          ),
        );
        setStreaming(false);
      },
    });
  }, []);

  const newChat = () => {
    handleRef.current?.cancel();
    setStreaming(false);
    setMessages([]);
  };

  // Auto-send a prefilled question handed over from the Today tab.
  const params = useLocalSearchParams<{ prefill?: string }>();
  const handledPrefill = useRef<string | null>(null);
  useEffect(() => {
    const p = typeof params.prefill === "string" ? params.prefill : undefined;
    if (p && handledPrefill.current !== p) {
      handledPrefill.current = p;
      send(p);
    }
  }, [params.prefill, send]);

  const isEmpty = messages.length === 0;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.background }]}
      edges={["top", "left", "right"]}
    >
      {/* new-chat control, only while a conversation exists */}
      {!isEmpty ? (
        <View style={styles.header}>
          <Pressable onPress={newChat} hitSlop={10} style={styles.headerBtn}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 5v14M5 12h14"
                stroke={theme.textSecondary}
                strokeWidth={2}
                strokeLinecap="round"
              />
            </Svg>
          </Pressable>
        </View>
      ) : null}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {isEmpty ? (
          <View style={styles.emptyWrap}>
            <EmptyState onPick={send} />
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            style={styles.flex}
            contentContainerStyle={styles.messages}
            onContentSizeChange={scrollToEnd}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="interactive"
          >
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
          </ScrollView>
        )}

        <View style={styles.inputBar}>
          <ChatInput onSend={send} disabled={streaming} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  headerBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyWrap: { flex: 1, paddingHorizontal: Spacing.xl },
  messages: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  inputBar: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
});
