/**
 * User settings — persisted preferences that used to be hardcoded constants.
 * Exposes both a React-friendly shape (via the context) and a module-level
 * snapshot (getSettings) so non-React data modules — verses.ts, times.ts,
 * ai.ts — can read the current edition/method without prop-drilling.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemePref = 'system' | 'light' | 'dark';
export type TimeFormat = '12h' | '24h';
export type CalendarSystem = 'gregorian' | 'hijri';

export type Settings = {
  theme: ThemePref;
  timeFormat: TimeFormat;
  calendar: CalendarSystem; // prayer calendar shown by Gregorian or Hijri month
  translation: string; // Al-Quran Cloud translation edition id, e.g. "en.sahih"
  translationName: string; // human label for the UI
  reciter: string; // audio edition id, e.g. "ar.alafasy"
  reciterName: string;
  prayerMethod: number; // AlAdhan calculation method id
};

export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  timeFormat: '24h',
  calendar: 'gregorian',
  translation: 'en.sahih',
  translationName: 'Saheeh International',
  reciter: 'ar.alafasy',
  reciterName: 'Mishary Rashid Alafasy',
  prayerMethod: 3,
};

const STORAGE_KEY = 'noor.settings.v1';

// In-memory snapshot for non-React callers. Kept in sync by the provider.
let snapshot: Settings = DEFAULT_SETTINGS;

export function getSettings(): Settings {
  return snapshot;
}

export function setSnapshot(s: Settings) {
  snapshot = s;
}

/** Load persisted settings, merged over defaults (so new keys get defaults). */
export async function loadSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function persistSettings(s: Settings): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // best effort — a failed write just means it won't survive a restart
  }
}

/** Format a "HH:MM" (24h) time string per the user's preference. */
export function formatTime(hhmm: string, fmt: TimeFormat): string {
  if (fmt === '24h') return hhmm;
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}
