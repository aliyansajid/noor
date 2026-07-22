import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
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

import { ScreenGlow } from "@/components/screen-glow";
import { ThemedText } from "@/components/themed-text";
import { Layout, Spacing } from "@/constants/theme";
import { streamAnswer, StreamHandle } from "@/features/chat/ai";
import { ChatInput } from "@/features/chat/components/chat-input";
import { EmptyState } from "@/features/chat/components/empty-state";
import { MessageBubble } from "@/features/chat/components/message-bubble";
import {
  ConversationSummary,
  createConversation,
  listConversations,
  loadMessages,
  saveMessage,
} from "@/features/chat/history";
import { Ayah, ChatMessage } from "@/features/chat/types";
import { useAuth } from "@/features/auth/auth-context";
import { useTheme } from "@/hooks/use-theme";

export default function Chat() {
  const theme = useTheme();
  const router = useRouter();
  const { configured, session } = useAuth();
  const persist = !!(configured && session);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [activeTitle, setActiveTitle] = useState("");
  const [recent, setRecent] = useState<ConversationSummary[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  const handleRef = useRef<StreamHandle | null>(null);
  const idRef = useRef(0);
  const nextId = () => `m${idRef.current++}`;

  // The conversation being written to (null = fresh, not yet created).
  const conversationIdRef = useRef<string | null>(null);
  // The current answer's final text/verses, captured for persistence on done.
  const finalTextRef = useRef("");
  const finalAyatRef = useRef<Ayah[] | undefined>(undefined);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() =>
      scrollRef.current?.scrollToEnd({ animated: true }),
    );
  }, []);

  const send = useCallback(
    (text: string) => {
      handleRef.current?.cancel();
      const assistantId = nextId();
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: "user", text },
        { id: assistantId, role: "assistant", text: "", pending: true },
      ]);
      setStreaming(true);
      finalTextRef.current = "";
      finalAyatRef.current = undefined;
      if (!conversationIdRef.current) setActiveTitle(text); // first message titles the chat

      // Persist (signed-in only): create the conversation on first message,
      // then save the user's turn. Non-blocking — never delays the stream.
      if (persist) {
        (async () => {
          if (!conversationIdRef.current) {
            conversationIdRef.current = await createConversation(text);
          }
          if (conversationIdRef.current) saveMessage(conversationIdRef.current, "user", text);
        })();
      }

      handleRef.current = streamAnswer(text, {
        onText: (full) => {
          finalTextRef.current = full;
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, text: full } : m)),
          );
        },
        onAyat: (ayat) => {
          finalAyatRef.current = ayat;
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, ayat } : m)),
          );
        },
        onPendingCards: (n) =>
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, pendingCards: (m.pendingCards ?? 0) + n } : m,
            ),
          ),
        onDone: () => {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, pending: false } : m)),
          );
          setStreaming(false);
          if (persist && conversationIdRef.current && finalTextRef.current) {
            saveMessage(
              conversationIdRef.current,
              "assistant",
              finalTextRef.current,
              finalAyatRef.current,
            );
          }
        },
      });
    },
    [persist],
  );

  const newChat = () => {
    handleRef.current?.cancel();
    setStreaming(false);
    setMessages([]);
    setActiveTitle("");
    conversationIdRef.current = null;
  };

  const openConversation = useCallback(async (id: string, title?: string) => {
    handleRef.current?.cancel();
    setStreaming(false);
    setActiveTitle(title ?? "");
    conversationIdRef.current = id;
    const msgs = await loadMessages(id);
    setMessages(msgs);
  }, []);

  // Load recent conversations to surface on the empty state (signed-in only).
  const isEmpty = messages.length === 0;
  useEffect(() => {
    if (!persist || !isEmpty) {
      setRecent([]);
      return;
    }
    let active = true;
    listConversations().then((list) => {
      if (active) setRecent(list.slice(0, 3));
    });
    return () => {
      active = false;
    };
  }, [persist, isEmpty]);

  // Auto-send a prefilled question, or resume a conversation from History.
  const params = useLocalSearchParams<{ prefill?: string; load?: string; title?: string }>();
  const handledPrefill = useRef<string | null>(null);
  const handledLoad = useRef<string | null>(null);
  useEffect(() => {
    const p = typeof params.prefill === "string" ? params.prefill : undefined;
    if (p && handledPrefill.current !== p) {
      handledPrefill.current = p;
      send(p);
    }
  }, [params.prefill, send]);
  useEffect(() => {
    const id = typeof params.load === "string" ? params.load : undefined;
    if (id && handledLoad.current !== id) {
      handledLoad.current = id;
      const title = typeof params.title === "string" ? params.title : undefined;
      openConversation(id, title);
    }
  }, [params.load, params.title, openConversation]);

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.background }]}
      edges={["top", "left", "right"]}
    >
      <ScreenGlow />

      {/* History (signed-in) on the left, new-chat on the right */}
      {persist || !isEmpty ? (
        <View style={styles.header}>
          {persist ? (
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                router.push("/chat-history");
              }}
              hitSlop={10}
              accessibilityLabel="Chat history"
              style={({ pressed }) => [styles.headerBtn, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M3 12a9 9 0 1 0 9-9 9 9 0 0 0-8 5M3 4v4h4M12 7v5l3.5 2"
                  stroke={theme.textSecondary}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Pressable>
          ) : (
            <View style={styles.headerBtn} />
          )}

          <ThemedText type="label" themeColor="text" numberOfLines={1} style={styles.headerTitle}>
            {isEmpty ? "" : activeTitle}
          </ThemedText>

          {!isEmpty ? (
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                newChat();
              }}
              hitSlop={10}
              accessibilityLabel="New chat"
              style={({ pressed }) => [styles.headerBtn, { opacity: pressed ? 0.7 : 1 }]}
            >
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
      ) : null}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {isEmpty ? (
          <View style={styles.emptyWrap}>
            <EmptyState onPick={send} recent={recent} onOpen={openConversation} />
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
    justifyContent: "space-between",
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.sm,
  },
  headerBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { flex: 1, textAlign: "center", marginHorizontal: Spacing.sm },
  emptyWrap: { flex: 1, paddingHorizontal: Layout.screenPadding },
  messages: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  inputBar: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
});
