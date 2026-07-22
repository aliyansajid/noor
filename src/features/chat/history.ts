/**
 * Chat history persistence (Supabase). Only used when signed in — guests keep
 * ephemeral, in-memory chats. `user_id` on conversations defaults to auth.uid()
 * in the schema, so inserts don't pass it and RLS keeps rows self-owned.
 */

import { Ayah, ChatMessage, ChatRole } from '@/features/chat/types';
import { supabase } from '@/lib/supabase';

export type ConversationSummary = {
  id: string;
  title: string;
  updatedAt: string;
};

/** Create a conversation, titled from the first message. Returns its id. */
export async function createConversation(title: string): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('conversations')
    .insert({ title: title.trim().slice(0, 120) || 'New chat' })
    .select('id')
    .single();
  if (error) return null;
  return data?.id ?? null;
}

/** Append a message (with its ayah cards, if any) to a conversation. */
export async function saveMessage(
  conversationId: string,
  role: ChatRole,
  content: string,
  ayat?: Ayah[],
): Promise<void> {
  if (!supabase) return;
  await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, role, content, ayat: ayat ?? null });
}

/** The user's conversations, most recent first. */
export async function listConversations(): Promise<ConversationSummary[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('conversations')
    .select('id, title, updated_at')
    .order('updated_at', { ascending: false })
    .limit(100);
  return (data ?? []).map((c) => ({
    id: c.id as string,
    title: (c.title as string) || 'New chat',
    updatedAt: c.updated_at as string,
  }));
}

/** All messages of a conversation, oldest first, as chat bubbles. */
export async function loadMessages(conversationId: string): Promise<ChatMessage[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('messages')
    .select('id, role, content, ayat')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  return (data ?? []).map((m) => ({
    id: `db-${m.id}`,
    role: m.role as ChatRole,
    text: (m.content as string) ?? '',
    ayat: (m.ayat as Ayah[] | null) ?? undefined,
  }));
}

/** Delete a conversation (messages cascade). */
export async function deleteConversation(id: string): Promise<void> {
  if (!supabase) return;
  await supabase.from('conversations').delete().eq('id', id);
}
