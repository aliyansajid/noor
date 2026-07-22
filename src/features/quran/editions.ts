/**
 * Catalog of Al-Quran Cloud editions (translations, reciters, tafsirs, and
 * Arabic scripts) — the raw material for the Settings pickers.
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

/** Audio reciters, de-duplicated. The catalog ships alternate takes of the same
 * reciter (e.g. `ar.alafasy` and `ar.alafasy-2`) with identical names; we keep
 * the canonical one per reciter. */
export const fetchReciters = async (signal?: AbortSignal): Promise<Edition[]> => {
  const list = await fetchEditions('format=audio', signal);
  // Sort so canonical ids ("ar.alafasy") sort before their "-2" duplicates.
  const sorted = [...list].sort((a, b) => a.identifier.localeCompare(b.identifier));
  const seen = new Set<string>();
  const out: Edition[] = [];
  for (const e of sorted) {
    const key = `${e.englishName}|${e.name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(e);
  }
  return out;
};

/** Tafsir (commentary) editions — all Arabic (6). */
export const fetchTafsirs = (signal?: AbortSignal) => fetchEditions('type=tafsir', signal);

// Curated readable Arabic script editions (the API's `quran` type also includes
// word-by-word / corpus / font-specific variants that don't render as body text).
const ARABIC_SCRIPT_IDS = [
  'quran-uthmani',
  'quran-uthmani-min',
  'quran-simple',
  'quran-simple-clean',
  'quran-simple-enhanced',
];

/** Readable Arabic script editions, in a sensible order (Uthmani first). */
export const fetchArabicScripts = async (signal?: AbortSignal): Promise<Edition[]> => {
  const all = await fetchEditions('format=text&type=quran', signal);
  return all
    .filter((e) => ARABIC_SCRIPT_IDS.includes(e.identifier))
    .sort((a, b) => ARABIC_SCRIPT_IDS.indexOf(a.identifier) - ARABIC_SCRIPT_IDS.indexOf(b.identifier));
};

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
