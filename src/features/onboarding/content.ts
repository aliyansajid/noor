/**
 * Content for the Noor onboarding funnel. Kept separate from presentation so
 * copy and steps can be tuned without touching layout code.
 */

import { MotifKey } from '@/features/onboarding/components/motifs';

export type IntroSlide = {
  key: string;
  title: string;
  subtitle: string;
  motif: MotifKey;
};

export const INTRO_SLIDES: IntroSlide[] = [
  {
    key: 'guidance',
    title: 'Guidance, whenever you need it',
    subtitle: 'Ask anything about the Qur’an and receive clear, grounded answers.',
    motif: 'star',
  },
  {
    key: 'authentic',
    title: 'Rooted in the Qur’an',
    subtitle: 'Every answer cites real ayat — Arabic, translation, and reference.',
    motif: 'arch',
  },
  {
    key: 'daily',
    title: 'A little light, every day',
    subtitle: 'One ayah each morning to steady your heart and start your day.',
    motif: 'lantern',
  },
];

export type SurveyOption = { key: string; label: string };

export type SurveyQuestion = {
  key: string;
  question: string;
  helper: string;
  multiSelect: boolean;
  options: SurveyOption[];
};

export const SURVEY_QUESTIONS: SurveyQuestion[] = [
  {
    key: 'goals',
    question: 'What brings you to Noor?',
    helper: 'Select one or more',
    multiSelect: true,
    options: [
      { key: 'peace', label: 'Find peace in hard moments' },
      { key: 'understand', label: 'Understand the Qur’an better' },
      { key: 'habit', label: 'Build a daily habit' },
      { key: 'questions', label: 'Get answers to my questions' },
      { key: 'closer', label: 'Grow closer to Allah' },
      { key: 'dua', label: 'Learn du’as and reflections' },
    ],
  },
  {
    key: 'frequency',
    question: 'How often would you like to connect?',
    helper: 'We’ll shape your daily rhythm around this',
    multiSelect: false,
    options: [
      { key: 'morning', label: 'Every morning' },
      { key: 'few', label: 'A few times a week' },
      { key: 'whenever', label: 'Whenever I need it' },
    ],
  },
];

export type PlanDay = {
  day: number;
  title: string;
  detail: string;
  glyph: string;
};

export const PLAN_DAYS: PlanDay[] = [
  { day: 1, title: 'Beginning with Bismillah', detail: 'Set a gentle intention for your journey.', glyph: '\u{1F33F}' },
  { day: 2, title: 'Patience (Sabr)', detail: 'Ayat on steadiness through hardship.', glyph: '\u{1F55B}' },
  { day: 3, title: 'Gratitude (Shukr)', detail: 'Noticing the blessings already around you.', glyph: '☀️' },
  { day: 4, title: 'Reliance on Allah (Tawakkul)', detail: 'Letting go of what you cannot control.', glyph: '\u{1FAB6}' },
  { day: 5, title: 'Mercy (Rahma)', detail: 'The vastness of Allah’s forgiveness.', glyph: '\u{1F54A}️' },
  { day: 6, title: 'Your daily anchor', detail: 'Choose an ayah to ground each morning.', glyph: '⚓' },
  { day: 7, title: 'A new dawn', detail: 'Reflect on how far you’ve come.', glyph: '\u{1F305}' },
];
