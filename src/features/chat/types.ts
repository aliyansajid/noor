/** Shared chat types. The mock responder and the future Vercel/Gemini
 * backend both produce this shape, so the UI never changes when we swap them. */

export type Ayah = {
  arabic: string;
  transliteration?: string;
  translation: string;
  reference: string; // e.g. "Al-Baqarah 2:286"
};

export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  ayat?: Ayah[];
  /** true while the assistant answer is still streaming in */
  pending?: boolean;
};
