import { useCallback, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { streamAnswer, StreamHandle } from "@/features/chat/ai";
import { ChatInput } from "@/features/chat/components/chat-input";
import { EmptyState } from "@/features/chat/components/empty-state";
import { MessageBubble } from "@/features/chat/components/message-bubble";
import { ChatMessage } from "@/features/chat/types";
import { useTheme } from "@/hooks/use-theme";

export default function Chat() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
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

  const isEmpty = messages.length === 0;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.background }]}
      edges={["top", "left", "right"]}
    >
      {/* header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <ThemedText type="subtitle" themeColor="primary">
          Noor
        </ThemedText>
        {!isEmpty ? (
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
        ) : (
          <View style={styles.headerBtn} />
        )}
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
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

        <View
          style={[
            styles.inputBar,
            { paddingBottom: Math.max(insets.bottom, Spacing.md) },
          ]}
        >
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
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
  inputBar: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
});
