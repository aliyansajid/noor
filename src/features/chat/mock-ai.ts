/**
 * Mock AI responder. Returns grounded, respectful answers with real ayah
 * citations and simulates token streaming. This mirrors the contract the
 * real backend (Vercel function → Gemini + Al-Quran Cloud) will fulfil, so
 * swapping it in later touches only this file.
 */

import { Ayah } from '@/features/chat/types';

type Entry = { keywords: string[]; answer: string; ayat: Ayah[] };

const KNOWLEDGE: Entry[] = [
  {
    keywords: ['patience', 'patient', 'sabr', 'wait', 'struggle', 'hard time', 'difficult'],
    answer:
      'Patience — sabr — is one of the most honoured qualities in the Qur’an. It doesn’t mean passively enduring, but holding steady with trust in Allah while you keep doing what is good. In moments of hardship, the Qur’an reassures us that difficulty is never the whole story.',
    ayat: [
      {
        reference: 'Ash-Sharh 94:5-6',
        arabic: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ۝ إِنَّ مَعَ الْعُسْرِ يُسْرًا',
        transliteration: 'Fa inna maʿa al-ʿusri yusrā, inna maʿa al-ʿusri yusrā',
        translation: 'So, surely with hardship comes ease. Surely with hardship comes ease.',
      },
    ],
  },
  {
    keywords: ['anxious', 'anxiety', 'worried', 'worry', 'peace', 'calm', 'stress', 'heart', 'rest'],
    answer:
      'When the heart feels restless, the Qur’an points us back to the remembrance of Allah as its true source of calm. Turning to Him — through dhikr, salah, or simply reflecting on His words — is described as the way hearts settle and find rest.',
    ayat: [
      {
        reference: 'Ar-Ra’d 13:28',
        arabic: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
        transliteration: 'Alā bi-dhikri llāhi taṭmaʾinnu al-qulūb',
        translation: 'Verily, in the remembrance of Allah do hearts find rest.',
      },
    ],
  },
  {
    keywords: ['trust', 'rely', 'reliance', 'tawakkul', 'control', 'future', 'afraid', 'fear'],
    answer:
      'Tawakkul is placing your trust in Allah after doing your part. It’s the balance between effort and surrender: you tie your camel, then you rely on Him for the outcome. The Qur’an promises that whoever truly relies on Allah will find Him sufficient.',
    ayat: [
      {
        reference: 'At-Talaq 65:3',
        arabic: 'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ',
        transliteration: 'Wa man yatawakkal ʿalā llāhi fa-huwa ḥasbuh',
        translation: 'And whoever relies upon Allah — then He is sufficient for him.',
      },
    ],
  },
  {
    keywords: ['forgive', 'forgiveness', 'sin', 'guilt', 'mistake', 'mercy', 'despair', 'repent'],
    answer:
      'No matter how far someone feels they’ve strayed, the Qur’an’s door of mercy stays open. Allah invites us never to lose hope in His forgiveness, reminding us that His mercy encompasses all things and that sincere returning to Him is always met.',
    ayat: [
      {
        reference: 'Az-Zumar 39:53',
        arabic: 'قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ',
        transliteration: 'Qul yā ʿibādiya lladhīna asrafū ʿalā anfusihim lā taqnaṭū min raḥmati llāh',
        translation:
          'Say, “O My servants who have transgressed against themselves, do not despair of the mercy of Allah.”',
      },
    ],
  },
  {
    keywords: ['grateful', 'gratitude', 'thankful', 'shukr', 'blessing', 'blessings'],
    answer:
      'Gratitude — shukr — is both a feeling and a practice: noticing Allah’s gifts and letting that shape how you live. The Qur’an ties gratitude directly to increase, teaching that a thankful heart opens the door to more.',
    ayat: [
      {
        reference: 'Ibrahim 14:7',
        arabic: 'لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ',
        transliteration: 'La-in shakartum la-azīdannakum',
        translation: 'If you are grateful, I will surely increase you [in favour].',
      },
    ],
  },
];

const DEFAULT: Entry = {
  keywords: [],
  answer:
    'That’s a meaningful thing to reflect on. The Qur’an speaks to the whole of human experience — and reminds us that our capacity is never asked to exceed what we can bear. Would you like me to explore a particular feeling, situation, or theme with you?',
  ayat: [
    {
      reference: 'Al-Baqarah 2:286',
      arabic: 'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا',
      transliteration: 'Lā yukallifu llāhu nafsan illā wusʿahā',
      translation: 'Allah does not burden a soul beyond that it can bear.',
    },
  ],
};

function match(question: string): Entry {
  const q = question.toLowerCase();
  let best: Entry | null = null;
  let bestScore = 0;
  for (const entry of KNOWLEDGE) {
    const score = entry.keywords.reduce((n, k) => (q.includes(k) ? n + 1 : n), 0);
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  return best ?? DEFAULT;
}

export type StreamHandle = { cancel: () => void };

/**
 * Simulate a streaming answer. Calls `onText` with the growing answer, then
 * `onAyat` once text finishes, then `onDone`. Returns a handle to cancel.
 */
export function streamAnswer(
  question: string,
  cbs: { onText: (full: string) => void; onAyat: (ayat: Ayah[]) => void; onDone: () => void },
): StreamHandle {
  const entry = match(question);
  const words = entry.answer.split(' ');
  let i = 0;
  let cancelled = false;
  const timers: ReturnType<typeof setTimeout>[] = [];

  // brief "thinking" pause, then stream word by word
  const start = setTimeout(function tick() {
    if (cancelled) return;
    i += 1;
    cbs.onText(words.slice(0, i).join(' '));
    if (i < words.length) {
      timers.push(setTimeout(tick, 42));
    } else {
      timers.push(
        setTimeout(() => {
          if (cancelled) return;
          cbs.onAyat(entry.ayat);
          cbs.onDone();
        }, 300),
      );
    }
  }, 650);
  timers.push(start);

  return {
    cancel: () => {
      cancelled = true;
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
