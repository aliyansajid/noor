@AGENTS.md

# Noor — Qur'an Chat App

> **Noor** (نور, "divine light") — an AI-powered conversational app for Muslims. Ask anything
> about the Qur'an and get grounded, respectful answers with authentic ayah citations.

Built as a technical assessment MVP for **8x**. North-star reference is **Bible Chat**
(thebiblechat.com). Judging criteria: a working MVP running on iOS **and** high UI/UX quality —
"how it looks and feels" is a hard requirement, weighted as heavily as function.

> **Expo v57 note:** this project is on Expo SDK 57 / RN 0.86. APIs have changed — consult the
> versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing framework code.

## Product philosophy

Bible Chat is a broad faith super-app (Chat, Community, Watch, Comics, Kids, Bibles, Plans).
Noor deliberately goes **narrow and deep**: nail the core loop — grounded chat with beautiful,
authentic ayah citations and recitation — instead of shipping a shallow clone of every tab.

## Stack

- **React Native 0.86.0** via **Expo SDK 57** (managed workflow)
- **expo-router** — file-based routing (`src/app/`)
- **TypeScript**
- **react-native-reanimated 4** — animations
- **Supabase** — auth + chat-history persistence *(to be added)*
- **AI:** Google Gemini (`gemini-3.5-flash`, free tier), called **directly** from the client
  (`src/features/chat/ai.ts`). New free-tier keys are gated to the Gemini 3.x line — `2.0-flash`
  has zero free quota and `2.5-flash` is closed to new users.
- **Qur'an data:** Al-Quran Cloud API (`alquran.cloud`, no key) — Arabic text (Uthmani),
  translation (Saheeh International), transliteration. Quran.com API optional for verse search (RAG).

> **Trust split:** Gemini writes the answer and picks *which* ayah(s) to cite (surah/verse numbers
> only). The authentic Arabic, translation, and transliteration are fetched from Al-Quran Cloud —
> so the sacred text is never AI-generated. This directly satisfies the "never invent Surah:Ayah"
> rule below.

> **API key:** direct client call for the MVP — the key ships in the bundle via
> `EXPO_PUBLIC_GEMINI_API_KEY` (in `.env`, gitignored; see `.env.example`). This is a deliberate
> MVP tradeoff, called out in the Loom. Production path: proxy through a Vercel function so the key
> stays server-side.

## Design system

**Name:** Noor · tagline "Quran Chat" / "Ask the Quran"

**Colors** — emerald + gold + ivory. Restrained, premium, meaningful. **Dark mode is the default**
(spiritual/night-reading feel; also photographs best for the Loom demo).

Dark (primary):
- Background `#0E1512` · Surface `#16211C`
- Primary emerald `#3FA985` · Deep emerald `#1B6B52`
- Gold accent `#E3C46B` (sparingly — ayah highlights, active states)
- Text `#EDE9DF` · Muted `#8A968F`

Light:
- Background `#FAF7F0` (warm ivory) · Surface `#FFFFFF`
- Primary `#1B6B52` · Gold `#C9A24B` · Text `#1A1A17`

**Fonts** (all free):
- **Arabic ayahs → KFGQPC Uthmanic Hafs** (authentic King Fahd mushaf script). Fallback:
  Amiri / Scheherazade New. Using the real Uthmanic script is a deliberate authenticity signal.
- **UI / body → Plus Jakarta Sans** (not Inter — intentionally warmer/more premium)
- **Headings (optional) → Fraunces** (editorial serif for titles / daily verse)

## Features

### In scope (MVP)
1. **Onboarding** — 3–4 intro slides, warm welcome, Supabase sign up / log in (email + Apple)
2. **AI Chat** (the heart) — streaming responses; ayah citations rendered as cards
   (Arabic + translation + Surah:Ayah); suggested starter prompts on empty state
3. **Chat history** — conversations persisted per-user in Supabase; tap to resume
4. **Today / Daily Verse** — one ayah/day with translation + short reflection (the habit hook)
5. **Delight (pick 1–2):** audio recitation of cited ayah · transliteration toggle ·
   share-as-image · dark/light theme · micro-animations

### Explicitly cut (mention in Loom as "what's next")
Community feed · Comics/Kids/Watch · streaks & multi-day plans · multiple translations/reciters ·
bookmarks/notes · push notifications · full Bible-style reader

### Screen map
`Onboarding → Auth → Chat (+ citations/audio) → History → Today` + Settings/theme

## Project structure

```
src/
  app/            expo-router routes (file = route)
    _layout.tsx   root layout
    index.tsx     entry
  components/     shared UI components
  constants/      theme.ts (palette/tokens)
  hooks/          use-color-scheme, use-theme
```

> The scaffold ships with Expo demo screens (`explore.tsx`, sample components). These are being
> replaced with Noor screens — don't treat the starter content as product code.

## Commands

```bash
npx expo start            # dev server + QR for Expo Go on iPhone
npx expo start --ios      # iOS simulator (needs Xcode)
npm run lint              # expo lint
```

Run on device: install **Expo Go** on the iPhone → `npx expo start` → scan QR with camera.

## Conventions

- Read colors/spacing from `src/constants/theme.ts` — no hardcoded hex in components.
- Arabic text must render RTL with the Uthmanic font; never left-align ayahs.
- Keep answers respectful in tone (adab); the AI must cite real ayahs, never invent Surah:Ayah
  numbers — ground with fetched verse data (see the trust-split note under Stack).
- The Gemini key ships in the bundle via `EXPO_PUBLIC_GEMINI_API_KEY` for the MVP (documented
  tradeoff). Supabase service-role / other secrets must NOT — those belong server-side only.
