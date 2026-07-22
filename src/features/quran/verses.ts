/**
 * Qur'an data access (Al-Quran Cloud, keyless). One place that turns a
 * surah:ayah reference into a fully-populated Ayah — authentic Uthmani Arabic,
 * Saheeh International translation, transliteration, and Alafasy recitation.
 * Both the chat grounding and the daily verse rely on this.
 */

import { Ayah } from '@/features/chat/types';
import { getSettings } from '@/features/settings/settings';

const AYAH_URL = 'https://api.alquran.cloud/v1/ayah';

/** Editions to request, in the fixed order fetchAyah parses: arabic, translation,
 * transliteration, audio. Arabic script, translation, and reciter follow the
 * user's settings. */
function editionsParam() {
  const { arabicEdition, translation, reciter } = getSettings();
  return `${arabicEdition},${translation},en.transliteration,${reciter}`;
}

/** Fetch one verse in all display editions. Returns null on any failure. */
export async function fetchAyah(
  surah: number,
  ayah: number,
  signal?: AbortSignal,
): Promise<Ayah | null> {
  try {
    const res = await fetch(`${AYAH_URL}/${surah}:${ayah}/editions/${editionsParam()}`, { signal });
    if (!res.ok) return null;
    const json = await res.json();
    const editions = json?.data;
    if (!Array.isArray(editions) || editions.length < 2) return null;

    const [arabicEd, translationEd, translitEd, audioEd] = editions;
    return {
      arabic: arabicEd.text,
      translation: translationEd.text,
      transliteration: translitEd?.text,
      audio: audioEd?.audio,
      reference: `${arabicEd.surah.englishName} ${arabicEd.surah.number}:${arabicEd.numberInSurah}`,
    };
  } catch {
    return null;
  }
}

/**
 * A hand-picked pool of beloved, uplifting verses for the daily verse — chosen
 * so the "verse of the day" always lands on something reflective, never an
 * administrative or legal passage. Each entry is [surah, ayah].
 */
const DAILY_POOL: readonly [number, number][] = [
  [2, 152], // remember Me, I will remember you
  [2, 153], // seek help through patience and prayer
  [2, 186], // I am near — I respond to the caller
  [2, 286], // Allah burdens no soul beyond its capacity
  [3, 139], // do not lose heart nor grieve
  [3, 173], // Allah is sufficient for us
  [3, 200], // be patient and persevere
  [8, 46], // be patient — Allah is with the patient
  [9, 40], // do not grieve, Allah is with us
  [11, 88], // my success is only through Allah
  [13, 28], // in the remembrance of Allah hearts find rest
  [14, 7], // if you are grateful, I will increase you
  [16, 97], // whoever does good — a good life
  [21, 87], // there is no deity except You, glory be to You
  [23, 118], // my Lord, forgive and have mercy
  [29, 69], // those who strive for Us — We guide them
  [39, 53], // do not despair of the mercy of Allah
  [40, 60], // call upon Me, I will respond
  [50, 16], // We are closer to him than his jugular vein
  [64, 11], // no disaster except by permission of Allah
  [65, 3], // whoever relies on Allah — He is sufficient
  [93, 5], // your Lord will give, and you will be satisfied
  [94, 6], // indeed, with hardship comes ease
  [41, 30], // do not fear nor grieve — angels descend
  [17, 82], // the Qur'an is a healing and mercy
  [25, 74], // grant us comfort of the eyes
  [67, 2], // He created death and life to test you
  [3, 26], // Owner of Sovereignty — in Your hand is all good
] as const;

/** Stable index for a given calendar day (UTC), so the verse changes once a day. */
function dailyIndex(date: Date, poolLength: number): number {
  const days = Math.floor(date.getTime() / 86_400_000);
  return ((days % poolLength) + poolLength) % poolLength;
}

/** The verse of the day for `date` (defaults handled by caller). */
export async function fetchDailyAyah(date: Date, signal?: AbortSignal): Promise<Ayah | null> {
  const [surah, ayah] = DAILY_POOL[dailyIndex(date, DAILY_POOL.length)];
  return fetchAyah(surah, ayah, signal);
}
