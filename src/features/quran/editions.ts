/**
 * Catalog of Al-Quran Cloud editions (translations, reciters) and AlAdhan
 * prayer-calculation methods — the raw material for the Settings pickers.
 */

const EDITION_URL = 'https://api.alquran.cloud/v1/edition';

export type Edition = {
  identifier: string;
  language: string;
  name: string;
  englishName: string;
};

async function fetchEditions(params: string, signal?: AbortSignal): Promise<Edition[]> {
  try {
    const res = await fetch(`${EDITION_URL}?${params}`, { signal });
    if (!res.ok) return [];
    const json = await res.json();
    const data = json?.data;
    if (!Array.isArray(data)) return [];
    return data.map((e: any) => ({
      identifier: e.identifier,
      language: e.language,
      name: e.name,
      englishName: e.englishName,
    }));
  } catch {
    return [];
  }
}

/** All text translations (124 across ~40 languages). */
export const fetchTranslations = (signal?: AbortSignal) =>
  fetchEditions('format=text&type=translation', signal);

/** All audio reciters (37). */
export const fetchReciters = (signal?: AbortSignal) => fetchEditions('format=audio', signal);

/** AlAdhan calculation methods — the widely-used subset. */
export const PRAYER_METHODS: { id: number; name: string }[] = [
  { id: 3, name: 'Muslim World League' },
  { id: 2, name: 'ISNA (North America)' },
  { id: 5, name: 'Egyptian General Authority' },
  { id: 4, name: 'Umm al-Qura, Makkah' },
  { id: 1, name: 'University of Karachi' },
  { id: 8, name: 'Gulf Region' },
  { id: 9, name: 'Kuwait' },
  { id: 10, name: 'Qatar' },
  { id: 12, name: 'UOIF (France)' },
  { id: 7, name: 'Tehran, Geophysics' },
];

/** Display names for the language codes the API returns. */
export const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English', ar: 'Arabic', ur: 'Urdu', fr: 'French', id: 'Indonesian',
  tr: 'Turkish', es: 'Spanish', de: 'German', ru: 'Russian', bn: 'Bengali',
  fa: 'Persian', hi: 'Hindi', it: 'Italian', nl: 'Dutch', pt: 'Portuguese',
  ml: 'Malayalam', ta: 'Tamil', sq: 'Albanian', az: 'Azerbaijani', ber: 'Berber',
  cs: 'Czech', dv: 'Divehi', ha: 'Hausa', ja: 'Japanese', ko: 'Korean',
  ku: 'Kurdish', no: 'Norwegian', pl: 'Polish', ro: 'Romanian', sd: 'Sindhi',
  so: 'Somali', sv: 'Swedish', sw: 'Swahili', tg: 'Tajik', th: 'Thai',
  tt: 'Tatar', ug: 'Uyghur', uz: 'Uzbek', zh: 'Chinese', am: 'Amharic',
};

export function languageName(code: string): string {
  return LANGUAGE_NAMES[code] ?? code.toUpperCase();
}
