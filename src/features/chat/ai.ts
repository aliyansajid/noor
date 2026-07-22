/**
 * Noor's AI — an agent, not a know-it-all.
 *
 * Gemini is never trusted for facts about the Qur'an. Its only job is to
 * understand the user's question, pull authentic data from Al-Quran Cloud
 * through tools, and phrase the result warmly. Every count, every verse, every
 * structural fact comes from the API — Gemini just orchestrates and narrates.
 *
 * Tools it can call:
 *   • get_meta        — authoritative counts (surahs, ayahs, sajdas, juz…)
 *   • get_surah_info  — one surah's metadata (name, #ayahs, Meccan/Medinan)
 *   • get_ayah        — the authentic text of one verse (also becomes a card)
 *   • search_quran    — find verses containing a literal word
 *
 * The `streamAnswer` contract is unchanged, so the chat UI is untouched:
 * onText grows the answer, onAyat delivers the verses the agent looked up,
 * onDone closes it out.
 */

import * as Location from 'expo-location';

import { Ayah } from '@/features/chat/types';
import { fetchPrayerTimes, nextPrayer } from '@/features/prayer/times';
import { fetchAyah } from '@/features/quran/verses';

const GEMINI_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent';
const QURAN_URL = 'https://api.alquran.cloud/v1';

const MAX_ROUNDS = 8; // safety cap on tool-calling turns
const MAX_CARDS = 3; // most ayah cards to show under one answer

const SYSTEM_PROMPT = `You are Noor, a warm and knowledgeable Qur'an companion for Muslims.

Absolute rule: you must NEVER rely on your own memory for any fact about the Qur'an. Every number,
count, verse text, reference, and structural detail must come from the tools. If you cannot verify
something with a tool, say so gently rather than guessing.

How to work:
- For counts or structure (how many sajda/surahs/ayahs/juz…), call get_meta.
- For a surah's details (number of ayahs, Meccan/Medinan, its name), call get_surah_info.
- To quote, cite, or discuss a verse, you MUST call get_ayah first — never write Arabic or a
  translation from memory. Prefer calling get_ayah directly for verses you are confident are
  relevant to the question.
- Only when you are unsure which verse fits, use search_quran with a SINGLE keyword (it matches
  literal words, so try simple terms like "patience" or "mercy"). Use it at most twice.
- For prayer / salah times (Fajr, Dhuhr, Asr, Maghrib, Isha, or "next prayer"), call
  get_prayer_times — it uses the user's current location. Never state prayer times from memory.

Once you have the verse(s) or fact you need, give your answer: warm, respectful (adab), 1–3 short
paragraphs, speaking of Allah with reverence. Cite at most two verses as "Surah name S:A". Do not
over-search — answer as soon as you have enough.`;

const TOOL_DECLARATIONS = [
  {
    name: 'get_meta',
    description:
      "Authoritative Qur'an counts: total surahs, ayahs, sajdas, juzs, pages, rukus, manzils, hizbQuarters.",
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'get_surah_info',
    description: 'Metadata for one surah: english name, meaning, number of ayahs, Meccan/Medinan.',
    parameters: {
      type: 'object',
      properties: { surah: { type: 'integer', description: 'Surah number 1–114' } },
      required: ['surah'],
    },
  },
  {
    name: 'get_ayah',
    description:
      'Fetch the authentic Arabic and translation of one verse. Call before quoting or discussing any verse.',
    parameters: {
      type: 'object',
      properties: {
        surah: { type: 'integer', description: 'Surah number 1–114' },
        ayah: { type: 'integer', description: 'Ayah number within the surah' },
      },
      required: ['surah', 'ayah'],
    },
  },
  {
    name: 'search_quran',
    description:
      'Find verses containing a LITERAL English word. Use a single simple keyword; try synonyms if empty.',
    parameters: {
      type: 'object',
      properties: { query: { type: 'string', description: 'A single keyword, e.g. "patience"' } },
      required: ['query'],
    },
  },
  {
    name: 'get_prayer_times',
    description:
      "Today's five prayer times (Fajr, Dhuhr, Asr, Maghrib, Isha) and the next prayer for the user's current location.",
    parameters: { type: 'object', properties: {} },
  },
];

async function getJson(url: string, signal: AbortSignal): Promise<any | null> {
  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** Collector shared across a single answer's tool calls. */
type AgentContext = {
  signal: AbortSignal;
  cards: Ayah[]; // verses fetched via get_ayah, rendered as cards
};

/** Run one tool call and return a compact result for the model. */
async function runTool(name: string, args: any, ctx: AgentContext): Promise<unknown> {
  switch (name) {
    case 'get_meta': {
      const json = await getJson(`${QURAN_URL}/meta`, ctx.signal);
      const d = json?.data;
      if (!d) return { error: 'unavailable' };
      return {
        surahs: d.surahs?.count,
        ayahs: d.ayahs?.count,
        sajdas: d.sajdas?.count,
        juzs: d.juzs?.count,
        pages: d.pages?.count,
        rukus: d.rukus?.count,
        manzils: d.manzils?.count,
        hizbQuarters: d.hizbQuarters?.count,
      };
    }
    case 'get_surah_info': {
      const json = await getJson(`${QURAN_URL}/surah/${args.surah}?limit=1`, ctx.signal);
      const d = json?.data;
      if (!d) return { error: 'not found' };
      return {
        number: d.number,
        englishName: d.englishName,
        meaning: d.englishNameTranslation,
        numberOfAyahs: d.numberOfAyahs,
        revelation: d.revelationType,
      };
    }
    case 'get_ayah': {
      const ayah = await fetchAyah(args.surah, args.ayah, ctx.signal);
      if (!ayah) return { error: 'not found' };
      // Show it as a card (dedupe by reference, cap the count).
      if (
        ctx.cards.length < MAX_CARDS &&
        !ctx.cards.some((c) => c.reference === ayah.reference)
      ) {
        ctx.cards.push(ayah);
      }
      return { reference: ayah.reference, translation: ayah.translation };
    }
    case 'search_quran': {
      const word = encodeURIComponent(String(args.query ?? '').trim());
      const json = await getJson(`${QURAN_URL}/search/${word}/all/en.sahih`, ctx.signal);
      const matches = json?.data?.matches;
      if (!Array.isArray(matches)) return { count: 0, matches: [] };
      return {
        count: json.data.count,
        matches: matches.slice(0, 6).map((m: any) => ({
          surah: m.surah?.number,
          ayah: m.numberInSurah,
          snippet: String(m.text ?? '').slice(0, 90),
        })),
      };
    }
    case 'get_prayer_times': {
      try {
        let perm = await Location.getForegroundPermissionsAsync();
        if (!perm.granted) perm = await Location.requestForegroundPermissionsAsync();
        if (!perm.granted) return { error: 'location_permission_denied' };

        const pos =
          (await Location.getLastKnownPositionAsync()) ??
          (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
        const now = new Date();
        const data = await fetchPrayerTimes(
          pos.coords.latitude,
          pos.coords.longitude,
          now,
          ctx.signal,
        );
        if (!data) return { error: 'unavailable' };
        return { hijriDate: data.hijri, prayers: data.prayers, next: nextPrayer(data.prayers, now) };
      } catch {
        return { error: 'unavailable' };
      }
    }
    default:
      return { error: `unknown tool ${name}` };
  }
}

/** Drive the tool-calling loop until Gemini produces a final text answer. */
async function runAgent(question: string, ctx: AgentContext): Promise<string> {
  const contents: any[] = [{ role: 'user', parts: [{ text: question }] }];

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: ctx.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
        generationConfig: { temperature: 0.7 },
      }),
    });
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);

    const json = await res.json();
    const content = json?.candidates?.[0]?.content;
    const parts: any[] = content?.parts ?? [];
    const calls = parts.filter((p) => p.functionCall).map((p) => p.functionCall);

    if (calls.length === 0) {
      return parts
        .map((p) => p.text ?? '')
        .join('')
        .trim();
    }

    // Execute every requested tool, then feed the results back.
    contents.push(content);
    const responses = [];
    for (const call of calls) {
      const result = await runTool(call.name, call.args ?? {}, ctx);
      responses.push({ functionResponse: { name: call.name, response: { result } } });
    }
    contents.push({ role: 'user', parts: responses });
  }

  // Ran out of rounds — ask once more for a plain answer from what we gathered.
  return 'Here is what I found, though I wasn’t able to fully finish looking it up. Please try rephrasing your question.';
}

export type StreamHandle = { cancel: () => void };

/**
 * Answer a question via the grounded agent, then reveal the text word-by-word
 * (streaming feel) before delivering the verses it looked up. Returns a cancel
 * handle.
 */
export function streamAnswer(
  question: string,
  cbs: { onText: (full: string) => void; onAyat: (ayat: Ayah[]) => void; onDone: () => void },
): StreamHandle {
  let cancelled = false;
  const controller = new AbortController();
  const timers: ReturnType<typeof setTimeout>[] = [];

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

    const ctx: AgentContext = { signal: controller.signal, cards: [] };
    try {
      const answer = await runAgent(question, ctx);
      if (cancelled) return;

      reveal(answer, () => {
        if (cancelled) return;
        if (ctx.cards.length) cbs.onAyat(ctx.cards);
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
 * A brief AI reflection on an already-authentic verse, for the daily verse
 * screen. Returns an empty string on any failure so the verse still renders.
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
