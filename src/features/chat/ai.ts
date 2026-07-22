/**
 * Noor's AI — an agent, not a know-it-all.
 *
 * Gemini is never trusted for facts about the Qur'an. Its only job is to
 * understand the user's question, pull authentic data from Al-Quran Cloud
 * through tools, and phrase the result warmly. Every count, every verse, every
 * structural fact comes from the API — Gemini just orchestrates and narrates.
 *
 * Tools it can call (all Al-Quran Cloud — the chat never leaves the Qur'an):
 *   • get_meta        — authoritative counts (surahs, ayahs, sajdas, juz…)
 *   • list_surahs     — the 114 surahs (number, name, meaning, #ayahs, place)
 *   • get_surah_info  — one surah's metadata (name, #ayahs, Meccan/Medinan)
 *   • get_ayah        — authentic verse(s); each becomes a card, in the user's editions
 *   • search_quran    — find verses containing a literal word
 *   • get_tafsir      — scholarly commentary (tafsir) for a verse
 *   • get_sajda       — the verses of prostration
 *   • get_random_ayah — a random verse
 *
 * Personalization: every verse shown honors the user's chosen Arabic script,
 * translation, and reciter; tafsir honors the chosen tafsir edition.
 *
 * The `streamAnswer` contract is unchanged, so the chat UI is untouched:
 * onText grows the answer, onAyat delivers the verses the agent looked up,
 * onDone closes it out.
 */

import { fetch as expoFetch } from 'expo/fetch';

import { Ayah } from '@/features/chat/types';
import { fetchAyah, fetchRandomAyah } from '@/features/quran/verses';
import { getSettings } from '@/features/settings/settings';

const GEMINI_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-3.5-flash';
const GEMINI_BASE = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}`;
const GEMINI_URL = `${GEMINI_BASE}:generateContent`;
const GEMINI_STREAM_URL = `${GEMINI_BASE}:streamGenerateContent`;
const QURAN_URL = 'https://api.alquran.cloud/v1';

const MAX_ROUNDS = 8; // safety cap on tool-calling turns
const MAX_CARDS = 8; // most ayah cards to show under one answer (e.g. a short surah)
const MAX_RANGE = 10; // most verses one get_ayah call will fetch

const SYSTEM_PROMPT = `You are Noor, a warm and knowledgeable Qur'an companion for Muslims. You answer
anything about the Qur'an — verses, meanings, themes, structure, counts, surahs, tafsir — always
grounded in the tools.

Absolute rule: you must NEVER rely on your own memory for any fact about the Qur'an. Every number,
count, verse text, reference, and commentary must come from the tools. If you cannot verify
something with a tool, say so gently rather than guessing.

How to work:
- Counts or structure (how many sajda/surahs/ayahs/juz/pages…): call get_meta.
- "Which surah…", ordering, or where a surah was revealed: call list_surahs.
- One surah's details (its name, number of ayahs, Meccan/Medinan): call get_surah_info.
- To quote, cite, or discuss a verse, you MUST call get_ayah first — never write Arabic or a
  translation from memory. Pass "count" to fetch a short run (e.g. a whole short surah). Fetched
  verses are shown to the user as cards, so fetch the ones you actually reference.
- Thematic questions: use search_quran with a SINGLE simple English keyword ("patience", "mercy")
  to locate candidates, then get_ayah the best fit(s). Use search at most twice; try a synonym if empty.
- To explain, interpret, or give the meaning/context of a verse, call get_tafsir. The commentary is
  in Arabic — read it and explain it clearly in the user's language.
- "Verses of sajda / prostration": call get_sajda.
- "Give me a verse" / inspiration with no specific topic: call get_random_ayah.

Once you have what you need, answer: warm, respectful (adab), 1–3 short paragraphs, speaking of
Allah with reverence. Cite verses as "Surah name S:A". Reply in the user's language. Don't
over-search — answer as soon as you have enough.`;

const TOOL_DECLARATIONS = [
  {
    name: 'get_meta',
    description:
      "Authoritative Qur'an counts: total surahs, ayahs, sajdas, juzs, pages, rukus, manzils, hizbQuarters.",
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'list_surahs',
    description:
      'The 114 surahs, each with number, English name, meaning, number of ayahs, and Meccan/Medinan. Use for ordering, naming, or revelation-place questions.',
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
      'Fetch the authentic Arabic + translation of a verse, or a short consecutive run. Call before quoting or discussing any verse. Each fetched verse is shown to the user as a card.',
    parameters: {
      type: 'object',
      properties: {
        surah: { type: 'integer', description: 'Surah number 1–114' },
        ayah: { type: 'integer', description: 'Starting ayah number within the surah' },
        count: {
          type: 'integer',
          description: `How many consecutive verses to fetch from "ayah" (default 1, max ${MAX_RANGE}).`,
        },
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
    name: 'get_tafsir',
    description:
      'Scholarly commentary (tafsir) for one verse, to explain its meaning or context. Returns Arabic tafsir text to read and explain.',
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
    name: 'get_sajda',
    description: 'The verses of prostration (sajda) in the Qur\'an, with their references.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'get_random_ayah',
    description: 'A random verse, for inspiration when no specific topic is asked. Shown as a card.',
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

/** Add a fetched verse as a card (dedupe by reference, cap the count). */
function addCard(ctx: AgentContext, ayah: Ayah) {
  if (ctx.cards.length < MAX_CARDS && !ctx.cards.some((c) => c.reference === ayah.reference)) {
    ctx.cards.push(ayah);
  }
}

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
    case 'list_surahs': {
      const json = await getJson(`${QURAN_URL}/surah`, ctx.signal);
      const arr = json?.data;
      if (!Array.isArray(arr)) return { error: 'unavailable' };
      return {
        surahs: arr.map((s: any) => ({
          number: s.number,
          name: s.englishName,
          meaning: s.englishNameTranslation,
          ayahs: s.numberOfAyahs,
          place: s.revelationType,
        })),
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
      const start = Number(args.ayah);
      const count = Math.min(Math.max(Number(args.count ?? 1), 1), MAX_RANGE);
      const verses: { reference: string; translation: string }[] = [];
      for (let i = 0; i < count; i++) {
        const ayah = await fetchAyah(args.surah, start + i, ctx.signal);
        if (!ayah) break; // ran past the end of the surah
        addCard(ctx, ayah);
        verses.push({ reference: ayah.reference, translation: ayah.translation });
      }
      return verses.length ? { verses } : { error: 'not found' };
    }
    case 'search_quran': {
      // English translation is used purely to LOCATE verses (Gemini keywords in
      // English); the verses shown to the user still use their chosen editions.
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
    case 'get_tafsir': {
      const { tafsir, tafsirName } = getSettings();
      const json = await getJson(`${QURAN_URL}/ayah/${args.surah}:${args.ayah}/${tafsir}`, ctx.signal);
      const d = json?.data;
      if (!d?.text) return { error: 'unavailable' };
      return {
        reference: `${d.surah?.englishName} ${d.surah?.number}:${d.numberInSurah}`,
        edition: tafsirName,
        tafsir: d.text,
      };
    }
    case 'get_sajda': {
      const json = await getJson(`${QURAN_URL}/sajda/en.sahih`, ctx.signal);
      const ayahs = json?.data?.ayahs;
      if (!Array.isArray(ayahs)) return { error: 'unavailable' };
      return {
        count: ayahs.length,
        verses: ayahs.map((a: any) => ({
          reference: `${a.surah?.englishName} ${a.surah?.number}:${a.numberInSurah}`,
          snippet: String(a.text ?? '').slice(0, 100),
        })),
      };
    }
    case 'get_random_ayah': {
      const ayah = await fetchRandomAyah(ctx.signal);
      if (!ayah) return { error: 'unavailable' };
      addCard(ctx, ayah);
      return { reference: ayah.reference, translation: ayah.translation };
    }
    default:
      return { error: `unknown tool ${name}` };
  }
}

const requestBody = (contents: any[]) =>
  JSON.stringify({
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents,
    tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
    generationConfig: { temperature: 0.7 },
  });

const OUT_OF_ROUNDS =
  'Here is what I found, though I wasn’t able to fully finish looking it up. Please try rephrasing your question.';

/** Run the tool calls a model turn requested, appending its turn and the
 * results to `contents` for the next round. */
async function applyToolCalls(
  contents: any[],
  modelParts: any[],
  calls: any[],
  ctx: AgentContext,
): Promise<void> {
  contents.push({ role: 'model', parts: modelParts });
  const responses = [];
  for (const call of calls) {
    const result = await runTool(call.name, call.args ?? {}, ctx);
    responses.push({ functionResponse: { name: call.name, response: { result } } });
  }
  contents.push({ role: 'user', parts: responses });
}

/** Non-streaming tool-calling loop (fallback path). */
async function runAgentBuffered(question: string, ctx: AgentContext): Promise<string> {
  const contents: any[] = [{ role: 'user', parts: [{ text: question }] }];

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: ctx.signal,
      body: requestBody(contents),
    });
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);

    const json = await res.json();
    const parts: any[] = json?.candidates?.[0]?.content?.parts ?? [];
    const calls = parts.filter((p) => p.functionCall).map((p) => p.functionCall);

    if (calls.length === 0) {
      return parts.map((p) => p.text ?? '').join('').trim();
    }
    await applyToolCalls(contents, parts, calls, ctx);
  }
  return OUT_OF_ROUNDS;
}

/** Stream one model turn (SSE). Forwards cumulative text via onText as tokens
 * arrive, and returns the round's text + any function calls. */
async function streamRound(
  contents: any[],
  ctx: AgentContext,
  onText: (full: string) => void,
): Promise<{ text: string; calls: any[] }> {
  const res = await expoFetch(`${GEMINI_STREAM_URL}?alt=sse&key=${GEMINI_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: ctx.signal,
    body: requestBody(contents),
  });
  if (!res.ok || !res.body) throw new Error(`Gemini stream ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let text = '';
  const calls: any[] = [];

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let nl: number;
    while ((nl = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;
      let chunk: any;
      try {
        chunk = JSON.parse(payload);
      } catch {
        continue; // partial JSON line — skip (rare with SSE framing)
      }
      const parts: any[] = chunk?.candidates?.[0]?.content?.parts ?? [];
      for (const p of parts) {
        if (typeof p.text === 'string' && p.text) {
          text += p.text;
          onText(text);
        }
        if (p.functionCall) calls.push(p.functionCall);
      }
    }
  }
  return { text, calls };
}

/** Streaming tool-calling loop. Tool rounds run silently; the final answer
 * streams token-by-token. `onAnswerStart` fires once, when the answer begins
 * (so verse cards can be shown just above the streaming text). */
async function runAgentStreaming(
  question: string,
  ctx: AgentContext,
  cbs: { onDelta: (full: string) => void; onAnswerStart: () => void },
): Promise<string> {
  const contents: any[] = [{ role: 'user', parts: [{ text: question }] }];

  for (let round = 0; round < MAX_ROUNDS; round++) {
    let started = false;
    const { text, calls } = await streamRound(contents, ctx, (full) => {
      if (!started) {
        started = true;
        cbs.onAnswerStart();
      }
      cbs.onDelta(full);
    });

    if (calls.length === 0) return text.trim();

    const modelParts: any[] = [];
    if (text) modelParts.push({ text });
    for (const c of calls) modelParts.push({ functionCall: c });
    await applyToolCalls(contents, modelParts, calls, ctx);
  }
  return OUT_OF_ROUNDS;
}

export type StreamHandle = { cancel: () => void };

/**
 * Answer a question via the grounded agent. Tool lookups run first (verse cards
 * are delivered the moment the answer begins), then the answer streams in
 * token-by-token. Falls back to a buffered word-by-word reveal if real
 * streaming isn't available. Returns a cancel handle.
 */
export function streamAnswer(
  question: string,
  cbs: { onText: (full: string) => void; onAyat: (ayat: Ayah[]) => void; onDone: () => void },
): StreamHandle {
  let cancelled = false;
  let cardsSent = false;
  const controller = new AbortController();
  const timers: ReturnType<typeof setTimeout>[] = [];

  const sendCards = (cards: Ayah[]) => {
    if (cancelled || cardsSent || !cards.length) return;
    cardsSent = true;
    cbs.onAyat(cards);
  };

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

    // Prefer real token streaming.
    try {
      const answer = await runAgentStreaming(question, ctx, {
        onDelta: (full) => {
          if (!cancelled) cbs.onText(full);
        },
        onAnswerStart: () => sendCards(ctx.cards),
      });
      if (cancelled) return;
      cbs.onText(answer); // settle final text (also covers a no-delta answer)
      sendCards(ctx.cards);
      cbs.onDone();
      return;
    } catch (streamErr) {
      if (cancelled) return;
      if (__DEV__) console.warn('[Noor AI] streaming failed, falling back', streamErr);
      // Fall through to the buffered path with a fresh context.
    }

    // Fallback: buffered answer, revealed word-by-word.
    const fctx: AgentContext = { signal: controller.signal, cards: [] };
    try {
      const answer = await runAgentBuffered(question, fctx);
      if (cancelled) return;
      reveal(answer, () => {
        sendCards(fctx.cards);
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
