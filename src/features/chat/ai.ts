/**
 * Real AI responder — a direct client call to Google Gemini (third-party).
 *
 * Split of trust, by design:
 *   • Gemini writes the answer prose and decides *which* ayah(s) to cite
 *     (surah + verse numbers only).
 *   • The authentic Arabic, translation, and transliteration are fetched from
 *     Al-Quran Cloud (keyless) — so the sacred text is never AI-generated.
 *
 * The `streamAnswer` contract is identical to the old mock, so chat.tsx is
 * untouched: onText grows the answer, onAyat delivers the verified verses,
 * onDone closes it out.
 */

import { Ayah } from '@/features/chat/types';
import { fetchAyah } from '@/features/quran/verses';

const GEMINI_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent';

const SYSTEM_PROMPT = `You are Noor, a warm and knowledgeable Qur'an companion for Muslims.
Answer the user's question with grounding in the Qur'an, in gentle, respectful language (adab).
Keep the answer to 2-4 short paragraphs — reflective, not preachy. Speak of Allah with reverence.
Cite 1 or 2 real Qur'anic verses that genuinely support your answer. NEVER invent a verse or
reference. Give exact surah and ayah numbers. If a topic isn't addressed by the Qur'an, say so
kindly rather than fabricating.`;

/** What Gemini returns — prose + which verses to cite (numbers only). */
type AiResult = {
  answer: string;
  ayat: { surah: number; ayah: number }[];
};

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    answer: { type: 'string' },
    ayat: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          surah: { type: 'integer' },
          ayah: { type: 'integer' },
        },
        required: ['surah', 'ayah'],
      },
    },
  },
  required: ['answer', 'ayat'],
};

/** Ask Gemini for a grounded answer + verse references. */
async function askGemini(question: string, signal: AbortSignal): Promise<AiResult> {
  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: question }] }],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  }

  const json = await res.json();
  const text: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned no content');

  const parsed = JSON.parse(text) as AiResult;
  return { answer: parsed.answer?.trim() ?? '', ayat: parsed.ayat ?? [] };
}

export type StreamHandle = { cancel: () => void };

/**
 * Fetch a real grounded answer, then reveal it word-by-word (preserving the
 * streaming feel) before delivering the verified ayat. Returns a cancel handle.
 */
export function streamAnswer(
  question: string,
  cbs: { onText: (full: string) => void; onAyat: (ayat: Ayah[]) => void; onDone: () => void },
): StreamHandle {
  let cancelled = false;
  const controller = new AbortController();
  const timers: ReturnType<typeof setTimeout>[] = [];

  /** Type `answer` out word-by-word, then run `after`. */
  function reveal(answer: string, after: () => void) {
    const words = answer.split(' ');
    let i = 0;
    const tick = () => {
      if (cancelled) return;
      i += 1;
      cbs.onText(words.slice(0, i).join(' '));
      if (i < words.length) timers.push(setTimeout(tick, 24));
      else after();
    };
    tick();
  }

  (async () => {
    if (!GEMINI_KEY) {
      cbs.onText(
        'I’m not connected yet — no Gemini API key is set. Add EXPO_PUBLIC_GEMINI_API_KEY to your .env and restart the app.',
      );
      cbs.onDone();
      return;
    }

    try {
      const result = await askGemini(question, controller.signal);
      if (cancelled) return;

      // Resolve the verses in parallel; keep only the ones that verified.
      const resolved = (
        await Promise.all(result.ayat.map((a) => fetchAyah(a.surah, a.ayah, controller.signal)))
      ).filter((a): a is Ayah => a !== null);
      if (cancelled) return;

      reveal(result.answer, () => {
        if (cancelled) return;
        if (resolved.length) cbs.onAyat(resolved);
        cbs.onDone();
      });
    } catch (err) {
      if (cancelled) return;
      cbs.onText(
        'I couldn’t reach the answer just now. Please check your connection and try again.',
      );
      cbs.onDone();
      if (__DEV__) console.warn('[Noor AI]', err);
    }
  })();

  return {
    cancel: () => {
      cancelled = true;
      controller.abort();
      timers.forEach(clearTimeout);
    },
  };
}

export const STARTER_PROMPTS = [
  'How do I find peace when I’m anxious?',
  'What does the Qur’an say about patience?',
  'Help me trust Allah with my future',
  'A verse about gratitude',
];

const REFLECTION_PROMPT = `You are Noor, a gentle Qur'an companion. Given a verse, offer ONE short,
warm reflection (1–2 sentences) that helps the reader carry its meaning into their day. Speak with
adab and reverence. Reply with only the reflection — no preamble, no quotes, no verse number.`;

/**
 * A brief AI reflection on a verse, for the daily verse screen. Returns an
 * empty string on any failure so the verse can still render on its own.
 */
export async function reflectOnVerse(
  reference: string,
  translation: string,
  signal?: AbortSignal,
): Promise<string> {
  if (!GEMINI_KEY) return '';
  try {
    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: REFLECTION_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: `${reference}: "${translation}"` }] }],
        generationConfig: { temperature: 0.8 },
      }),
    });
    if (!res.ok) return '';
    const json = await res.json();
    return (json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '').trim();
  } catch {
    return '';
  }
}
