/**
 * Noor's AI — an agent, not a know-it-all.
 *
 * The LLM (Groq / Llama, OpenAI-compatible) is never trusted for facts about the
 * Qur'an. Its only job is to understand the user's question, pull authentic data
 * from Al-Quran Cloud through tools, and phrase the result warmly. Every count,
 * every verse, every structural fact comes from the API — the model just
 * orchestrates and narrates.
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

// Groq (OpenAI-compatible) — generous free tier, fast, supports tool calling.
const GROQ_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
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
- "What is in juz N" (a para): call get_juz. "What is on page N" (mushaf page): call get_page.
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
    name: 'get_juz',
    description:
      'What a juz (1–30) contains: the surahs it spans and its start/end verse range. Use for "what is in juz N".',
    parameters: {
      type: 'object',
      properties: { juz: { type: 'integer', description: 'Juz number 1–30' } },
      required: ['juz'],
    },
  },
  {
    name: 'get_page',
    description:
      'The verses on a mushaf page (1–604): their references and the surah(s) on that page.',
    parameters: {
      type: 'object',
      properties: { page: { type: 'integer', description: 'Page number 1–604' } },
      required: ['page'],
    },
  },
  {
    name: 'get_random_ayah',
    description: 'A random verse, for inspiration when no specific topic is asked. Shown as a card.',
    parameters: { type: 'object', properties: {} },
  },
];

// OpenAI-compatible tool schema shape Groq expects.
const TOOLS = TOOL_DECLARATIONS.map((t) => ({ type: 'function', function: t }));

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
  /** Signals that `n` verse cards are about to be fetched, so the UI can show
   * skeletons while they load. */
  onPending?: (n: number) => void;
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
      ctx.onPending?.(count); // hint the UI to show skeleton card(s)
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
    case 'get_juz': {
      const json = await getJson(`${QURAN_URL}/juz/${args.juz}/en.sahih`, ctx.signal);
      const ayahs = json?.data?.ayahs;
      if (!Array.isArray(ayahs) || !ayahs.length) return { error: 'not found' };
      const first = ayahs[0];
      const last = ayahs[ayahs.length - 1];
      return {
        juz: Number(args.juz),
        surahs: [...new Set(ayahs.map((a: any) => a.surah?.englishName).filter(Boolean))],
        from: `${first.surah?.englishName} ${first.surah?.number}:${first.numberInSurah}`,
        to: `${last.surah?.englishName} ${last.surah?.number}:${last.numberInSurah}`,
        ayahCount: ayahs.length,
      };
    }
    case 'get_page': {
      const json = await getJson(`${QURAN_URL}/page/${args.page}/en.sahih`, ctx.signal);
      const ayahs = json?.data?.ayahs;
      if (!Array.isArray(ayahs) || !ayahs.length) return { error: 'not found' };
      return {
        page: Number(args.page),
        surahs: [...new Set(ayahs.map((a: any) => a.surah?.englishName).filter(Boolean))],
        count: ayahs.length,
        ayahs: ayahs.slice(0, 20).map((a: any) => ({
          reference: `${a.surah?.englishName} ${a.surah?.number}:${a.numberInSurah}`,
          snippet: String(a.text ?? '').slice(0, 80),
        })),
      };
    }
    case 'get_random_ayah': {
      ctx.onPending?.(1);
      const ayah = await fetchRandomAyah(ctx.signal);
      if (!ayah) return { error: 'unavailable' };
      addCard(ctx, ayah);
      return { reference: ayah.reference, translation: ayah.translation };
    }
    default:
      return { error: `unknown tool ${name}` };
  }
}

const AUTH_HEADERS = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${GROQ_KEY}`,
};

/** messages already includes the running turns; system prompt is prepended. */
const requestBody = (messages: any[], stream: boolean) =>
  JSON.stringify({
    model: GROQ_MODEL,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
    tools: TOOLS,
    temperature: 0.7,
    stream,
  });

const OUT_OF_ROUNDS =
  'Here is what I found, though I wasn’t able to fully finish looking it up. Please try rephrasing your question.';

/** Run the tool calls a model turn requested, appending its turn and each
 * result to `messages` for the next round (OpenAI tool-calling shape). */
async function applyToolCalls(
  messages: any[],
  assistantMessage: any,
  toolCalls: any[],
  ctx: AgentContext,
): Promise<void> {
  messages.push(assistantMessage);
  for (const tc of toolCalls) {
    let args: any = {};
    try {
      args = tc.function?.arguments ? JSON.parse(tc.function.arguments) : {};
    } catch {
      args = {};
    }
    const result = await runTool(tc.function?.name, args, ctx);
    messages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(result) });
  }
}

/** Non-streaming tool-calling loop (fallback path). */
async function runAgentBuffered(question: string, ctx: AgentContext): Promise<string> {
  const messages: any[] = [{ role: 'user', content: question }];

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: AUTH_HEADERS,
      signal: ctx.signal,
      body: requestBody(messages, false),
    });
    if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);

    const msg = (await res.json())?.choices?.[0]?.message;
    const toolCalls: any[] = msg?.tool_calls ?? [];

    if (toolCalls.length === 0) {
      return (msg?.content ?? '').trim();
    }
    await applyToolCalls(messages, msg, toolCalls, ctx);
  }
  return OUT_OF_ROUNDS;
}

/** Stream one model turn (SSE, OpenAI delta format). Forwards cumulative text
 * via onText as tokens arrive, and returns the round's text + any tool calls
 * (accumulated from streamed fragments). */
async function streamRound(
  messages: any[],
  ctx: AgentContext,
  onText: (full: string) => void,
): Promise<{ text: string; toolCalls: any[] }> {
  const res = await expoFetch(GROQ_URL, {
    method: 'POST',
    headers: AUTH_HEADERS,
    signal: ctx.signal,
    body: requestBody(messages, true),
  });
  if (!res.ok || !res.body) throw new Error(`Groq stream ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let text = '';
  const toolCalls: any[] = []; // indexed; fragments accumulate per index

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
      const delta = chunk?.choices?.[0]?.delta;
      if (!delta) continue;
      if (typeof delta.content === 'string' && delta.content) {
        text += delta.content;
        onText(text);
      }
      if (Array.isArray(delta.tool_calls)) {
        for (const d of delta.tool_calls) {
          const i = d.index ?? 0;
          if (!toolCalls[i]) {
            toolCalls[i] = { id: '', type: 'function', function: { name: '', arguments: '' } };
          }
          if (d.id) toolCalls[i].id = d.id;
          if (d.function?.name) toolCalls[i].function.name = d.function.name;
          if (d.function?.arguments) toolCalls[i].function.arguments += d.function.arguments;
        }
      }
    }
  }
  return { text, toolCalls: toolCalls.filter(Boolean) };
}

/** Streaming tool-calling loop. Tool rounds run silently; the final answer
 * streams token-by-token. `onAnswerStart` fires once, when the answer begins
 * (so verse cards can be shown just above the streaming text). */
async function runAgentStreaming(
  question: string,
  ctx: AgentContext,
  cbs: { onDelta: (full: string) => void; onAnswerStart: () => void },
): Promise<string> {
  const messages: any[] = [{ role: 'user', content: question }];

  for (let round = 0; round < MAX_ROUNDS; round++) {
    let started = false;
    const { text, toolCalls } = await streamRound(messages, ctx, (full) => {
      if (!started) {
        started = true;
        cbs.onAnswerStart();
      }
      cbs.onDelta(full);
    });

    if (toolCalls.length === 0) return text.trim();

    await applyToolCalls(
      messages,
      { role: 'assistant', content: text || null, tool_calls: toolCalls },
      toolCalls,
      ctx,
    );
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
  cbs: {
    onText: (full: string) => void;
    onAyat: (ayat: Ayah[]) => void;
    onPendingCards: (n: number) => void;
    onDone: () => void;
  },
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
    if (!GROQ_KEY) {
      cbs.onText(
        'I’m not connected yet — no API key is set. Add EXPO_PUBLIC_GROQ_API_KEY to your .env and restart the app.',
      );
      cbs.onDone();
      return;
    }

    const onPending = (n: number) => {
      if (!cancelled) cbs.onPendingCards(n);
    };
    const ctx: AgentContext = { signal: controller.signal, cards: [], onPending };

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
    const fctx: AgentContext = { signal: controller.signal, cards: [], onPending };
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
