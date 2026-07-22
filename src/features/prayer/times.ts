/**
 * Prayer times via the AlAdhan API (keyless). Given a location — GPS coords or
 * a city — we fetch the daily prayers (+ Sunrise & Hijri date) or a whole
 * month's calendar, and compute which prayer is next.
 */

const BASE = 'https://api.aladhan.com/v1';
const METHOD = 3; // Muslim World League — a widely-used default calculation

/** The five obligatory prayers, in order (used for "next prayer"). */
const PRAYER_ORDER = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;

/** A location is either device coordinates or a named city. */
export type Loc = { latitude: number; longitude: number } | { city: string; country?: string };

export type Prayer = { name: string; time: string }; // time as "HH:MM"
export type PrayerData = {
  hijri: string; // e.g. "8 Ṣafar 1448"
  sunrise: string; // "HH:MM"
  prayers: Prayer[]; // the five obligatory, in order
};
export type CalendarDay = {
  day: string; // "01".."31"
  weekday: string; // "Wednesday"
  prayers: Prayer[]; // the five, in order
};
export type NextPrayer = { name: string; time: string; minutesUntil: number };

function pad(n: number) {
  return String(n).padStart(2, '0');
}

/** "02:44 (UTC)" -> "02:44" */
function cleanTime(t: string) {
  return String(t).split(' ')[0];
}

function locQuery(loc: Loc) {
  return 'city' in loc
    ? `city=${encodeURIComponent(loc.city)}&country=${encodeURIComponent(loc.country ?? '')}`
    : `latitude=${loc.latitude}&longitude=${loc.longitude}`;
}

function toPrayers(timings: any): Prayer[] {
  return PRAYER_ORDER.map((name) => ({ name, time: cleanTime(timings[name]) }));
}

async function getJson(url: string, signal?: AbortSignal): Promise<any | null> {
  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** Today's (or a given date's) prayers for a location. */
export async function fetchTimings(
  loc: Loc,
  date: Date,
  signal?: AbortSignal,
): Promise<PrayerData | null> {
  const path = 'city' in loc ? 'timingsByCity' : 'timings';
  const d = `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
  const json = await getJson(`${BASE}/${path}/${d}?${locQuery(loc)}&method=${METHOD}`, signal);
  const data = json?.data;
  if (!data?.timings) return null;

  const h = data.date?.hijri;
  return {
    hijri: h ? `${h.day} ${h.month?.en} ${h.year}` : '',
    sunrise: cleanTime(data.timings.Sunrise),
    prayers: toPrayers(data.timings),
  };
}

/** Convenience wrapper kept for existing coordinate-based callers. */
export function fetchPrayerTimes(
  latitude: number,
  longitude: number,
  date: Date,
  signal?: AbortSignal,
): Promise<PrayerData | null> {
  return fetchTimings({ latitude, longitude }, date, signal);
}

/** A whole month's prayer calendar for a location. */
export async function fetchCalendar(
  loc: Loc,
  year: number,
  month: number,
  signal?: AbortSignal,
): Promise<CalendarDay[] | null> {
  const path = 'city' in loc ? 'calendarByCity' : 'calendar';
  const json = await getJson(`${BASE}/${path}/${year}/${month}?${locQuery(loc)}&method=${METHOD}`, signal);
  const days = json?.data;
  if (!Array.isArray(days)) return null;

  return days.map((d: any) => ({
    day: d.date?.gregorian?.day ?? '',
    weekday: d.date?.gregorian?.weekday?.en ?? '',
    prayers: toPrayers(d.timings),
  }));
}

function toMinutes(time: string) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Which prayer is next (may wrap to tomorrow's Fajr). */
export function nextPrayer(prayers: Prayer[], now: Date): NextPrayer | null {
  if (!prayers.length) return null;
  const nowMin = now.getHours() * 60 + now.getMinutes();

  for (const p of prayers) {
    const t = toMinutes(p.time);
    if (t > nowMin) return { name: p.name, time: p.time, minutesUntil: t - nowMin };
  }
  const fajr = prayers[0];
  return {
    name: fajr.name,
    time: fajr.time,
    minutesUntil: 24 * 60 - nowMin + toMinutes(fajr.time),
  };
}

/** 134 -> "2h 14m", 40 -> "40m" */
export function formatCountdown(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
