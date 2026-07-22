/**
 * Prayer times via the AlAdhan API (keyless). Given a location — GPS coords or
 * a city — we fetch the daily prayers (+ Sunrise & Hijri date) or a whole
 * month's calendar, and compute which prayer is next. No calculation method is
 * sent: AlAdhan picks the regionally-correct method from the coordinates.
 */

const BASE = 'https://api.aladhan.com/v1';

/** The five obligatory prayers, in order (used for "next prayer"). */
const PRAYER_ORDER = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;

/** A location is either device coordinates or a named city. */
export type Loc = { latitude: number; longitude: number } | { city: string; country?: string };

export type CalendarSystem = 'gregorian' | 'hijri';

export type Prayer = { name: string; time: string }; // time as "HH:MM"
export type PrayerData = {
  hijri: string; // e.g. "8 Ṣafar 1448"
  hijriDay: number; // 8
  hijriMonth: number; // 1..12 (Hijri month number)
  hijriMonthName: string; // "Ṣafar"
  hijriYear: number; // 1448
  sunrise: string; // "HH:MM"
  sunset: string; // "HH:MM"
  prayers: Prayer[]; // the five obligatory, in order
};
export type CalendarDay = {
  day: string; // day-of-month in the active calendar system
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
  const json = await getJson(`${BASE}/${path}/${d}?${locQuery(loc)}`, signal);
  const data = json?.data;
  if (!data?.timings) return null;

  const h = data.date?.hijri;
  return {
    hijri: h ? `${h.day} ${h.month?.en} ${h.year}` : '',
    hijriDay: Number(h?.day) || 0,
    hijriMonth: Number(h?.month?.number) || 0,
    hijriMonthName: h?.month?.en ?? '',
    hijriYear: Number(h?.year) || 0,
    sunrise: cleanTime(data.timings.Sunrise),
    sunset: cleanTime(data.timings.Sunset),
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

/** A whole month's prayer calendar for a location, in the given calendar system.
 * For 'hijri', pass the Hijri year/month; for 'gregorian', the Gregorian ones. */
export async function fetchCalendar(
  loc: Loc,
  year: number,
  month: number,
  system: CalendarSystem,
  signal?: AbortSignal,
): Promise<CalendarDay[] | null> {
  const base = system === 'hijri' ? 'hijriCalendar' : 'calendar';
  const path = 'city' in loc ? `${base}ByCity` : base;
  const json = await getJson(`${BASE}/${path}/${year}/${month}?${locQuery(loc)}`, signal);
  const days = json?.data;
  if (!Array.isArray(days)) return null;

  return days.map((d: any) => ({
    // Day number comes from the active system; weekday is calendar-agnostic.
    day: (system === 'hijri' ? d.date?.hijri?.day : d.date?.gregorian?.day) ?? '',
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

/** The prayer whose time is currently active — the most recent one that has
 * passed. Before Fajr it's the previous night's Isha (which runs until Fajr). */
export function currentPrayer(prayers: Prayer[], now: Date): string | null {
  if (!prayers.length) return null;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  let current = prayers[prayers.length - 1].name; // Isha carries overnight
  for (const p of prayers) {
    if (toMinutes(p.time) <= nowMin) current = p.name;
  }
  return current;
}

/** 134 -> "2h 14m", 40 -> "40m" */
export function formatCountdown(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
