/** Shared chat types. Gemini + Al-Quran Cloud produce this shape, so the UI
 * stays stable regardless of how the answer was sourced. */

export type Ayah = {
  arabic: string;
  transliteration?: string;
  translation: string;
  reference: string; // e.g. "Al-Baqarah 2:286"
  audio?: string; // recitation MP3 (Al-Quran Cloud, ar.alafasy)
};

export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  ayat?: Ayah[];
  /** true while the assistant answer is still streaming in */
  pending?: boolean;
  /** how many verse cards are being fetched — renders skeletons until `ayat` arrives */
  pendingCards?: number;
};
