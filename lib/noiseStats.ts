import { NoiseDataPoint, NoiseStats, HourlyAvg, EvalWindow } from '@/types';

/**
 * Energetický (logaritmický) průměr hladin v dB.
 * Leq = 10 * log10(1/n * sum(10^(Li/10)))
 */
export function calculateLogAverage(values: number[]): number {
  if (values.length === 0) return 0;
  const sumOfPowers = values.reduce((sum, db) => sum + Math.pow(10, db / 10), 0);
  return 10 * Math.log10(sumOfPowers / values.length);
}

/**
 * Akustický percentil ze seřazených hodnot (vzestupně).
 * V akustice je pořadí obrácené: L5 = hladina překročená 5 % času
 * (statisticky 95. percentil), L95 = hladina překročená 95 % času.
 */
export function getAcousticPercentile(sortedValues: number[], acousticPercentile: number): number {
  const statisticalPercentile = 1 - (acousticPercentile / 100);
  const index = Math.floor(sortedValues.length * statisticalPercentile);
  return sortedValues[Math.min(index, sortedValues.length - 1)];
}

const DAY_HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6–21
const NIGHT_HOURS = [22, 23, 0, 1, 2, 3, 4, 5];
const HOUR_MS = 3600 * 1000;

/** Hranice pokrytí hodiny, pod kterou aplikace upozorňuje (podíl 0–1). */
export const LOW_COVERAGE = 0.5;

const pad = (n: number) => n.toString().padStart(2, '0');

/** Date -> "YYYY-MM-DDTHH:MM" v místním čase (formát pro <input type="datetime-local">). */
export function toLocalDateTime(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** "YYYY-MM-DDTHH:MM" (místní čas) -> Date */
export function fromLocalDateTime(s: string): Date {
  const [date, time = '00:00'] = s.split('T');
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm);
}

/** "YYYY-MM-DDTHH:MM" -> "D. M." */
export function formatShortDate(s: string): string {
  const [, m, d] = s.slice(0, 10).split('-').map(Number);
  return `${d}. ${m}.`;
}

/**
 * Interval vzorkování v ms (typicky 1 s): medián průměrného kroku přes 10 bodů.
 * Průměr přes 10 bodů vyrovná časy zaokrouhlené o sekundu (kroky 2 s a 0 s),
 * medián ignoruje mezery v měření.
 */
export function samplingIntervalMs(points: NoiseDataPoint[]): number {
  const STEP = 10;
  const diffs: number[] = [];
  for (let i = STEP; i < points.length && diffs.length < 5000; i += STEP) {
    const d = (points[i].datetime.getTime() - points[i - STEP].datetime.getTime()) / STEP;
    if (d > 0) diffs.push(d);
  }
  if (diffs.length === 0) return 1000;
  diffs.sort((a, b) => a - b);
  return diffs[Math.floor(diffs.length / 2)];
}

/**
 * Výchozí období vyhodnocení: 24 h od první celé hodiny měření.
 * Když data tak daleko nesahají, začne se hodinou, ve které měření začalo
 * (např. měření 9:22–9:08 → 9:00–9:00, první hodina je pak neúplná).
 */
export function defaultEvalWindow(points: NoiseDataPoint[]): EvalWindow | null {
  if (points.length === 0) return null;
  const first = points[0].datetime;
  const last = points[points.length - 1].datetime;

  const floorStart = new Date(first);
  floorStart.setMinutes(0, 0, 0);
  const ceilStart = floorStart.getTime() === first.getTime()
    ? floorStart
    : new Date(floorStart.getTime() + HOUR_MS);

  for (const start of [ceilStart, floorStart]) {
    const end = new Date(start.getTime() + 24 * HOUR_MS);
    if (last.getTime() >= end.getTime() - 60 * 1000) {
      return { from: toLocalDateTime(start), to: toLocalDateTime(end) };
    }
  }
  // Měření kratší než 24 h – celé měření po celých hodinách
  const end = new Date(last);
  end.setMinutes(0, 0, 0);
  if (end.getTime() < last.getTime()) end.setTime(end.getTime() + HOUR_MS);
  return { from: toLocalDateTime(floorStart), to: toLocalDateTime(end) };
}

/**
 * Opraví časovou osu projektů načtených starší verzí aplikace.
 * Starší parser o půlnoci posouval čas: u SVAN exportů skočilo datum o den
 * dopředu (čas 1,000… = 24:00), u XL2 dostal bod přesně v 0:00:00 čas 1:00.
 * Hodina (`hour`) byla u SVAN správně, ale data (`datetime`) ne.
 * Body musí jít za sebou; velký skok dopředu (> 12 h) se vrátí o celé dny,
 * osamocený bod mimo pořadí se posune za předchozí bod.
 */
export function repairTimeline(points: NoiseDataPoint[]): NoiseDataPoint[] {
  if (points.length < 2) return points;
  const interval = samplingIntervalMs(points);
  const DAY_MS = 24 * HOUR_MS;
  const t = points.map(p => p.datetime.getTime());

  // 1) osamocený bod: o víc než 30 min za předchozím i za následujícím
  for (let i = 1; i < t.length - 1; i++) {
    if (t[i] - t[i - 1] > 30 * 60 * 1000 && t[i + 1] - t[i] < -30 * 60 * 1000) {
      t[i] = t[i - 1] + interval;
    }
  }
  // 2) skok o celé dny dopředu → posun všech dalších bodů zpět
  let shift = 0;
  const fixed: number[] = [t[0]];
  for (let i = 1; i < t.length; i++) {
    let ti = t[i] + shift;
    const diff = ti - fixed[i - 1];
    if (diff > 12 * HOUR_MS) {
      const days = Math.round(diff / DAY_MS);
      shift -= days * DAY_MS;
      ti -= days * DAY_MS;
    }
    fixed.push(ti);
  }

  let changed = false;
  const result = points.map((p, i) => {
    if (fixed[i] === p.datetime.getTime()) return p;
    changed = true;
    const datetime = new Date(fixed[i]);
    return { ...p, datetime, hour: datetime.getHours(), minute: datetime.getMinutes() };
  });
  return changed ? result : points;
}

/** Body uvnitř období [from, to). Bez období vrací všechny body. */
export function filterToWindow(points: NoiseDataPoint[], window?: EvalWindow | null): NoiseDataPoint[] {
  if (!window) return points;
  const from = fromLocalDateTime(window.from).getTime();
  const to = fromLocalDateTime(window.to).getTime();
  return points.filter(p => {
    const t = p.datetime.getTime();
    return t >= from && t < to;
  });
}

/**
 * Statistiky měření.
 *
 * Den (6–22 h) a noc (22–6 h) se počítají jako energetický průměr HODINOVÝCH LAeq,
 * každá hodina má stejnou váhu. Hodina, ze které byly vymazány ruchy, tak dál
 * zastupuje celou hodinu (LAeq zbytku hodiny = LAeq hodiny).
 *
 * S obdobím vyhodnocení (window) se berou jen body uvnitř období, takže se
 * u měření delšího než 24 h neslévají stejné hodiny ze dvou dnů.
 * Pokrytí hodiny = podíl hodiny, pro který zbyla data (po vymazání ruchů).
 */
export function calculateStats(
  points: NoiseDataPoint[],
  window?: EvalWindow | null,
  intervalMs?: number,
): NoiseStats {
  const interval = intervalMs ?? samplingIntervalMs(points);
  const used = filterToWindow(points, window);
  const source = used.length > 0 ? used : points;

  const values = source.map(p => p.value).sort((a, b) => a - b);

  const min = values[0];
  const max = values[values.length - 1];
  const avg = calculateLogAverage(values);
  const median = values[Math.floor(values.length / 2)];
  const p10 = getAcousticPercentile(values, 10);
  const p90 = getAcousticPercentile(values, 90);

  const byHour = new Map<number, NoiseDataPoint[]>();
  for (const p of source) {
    const list = byHour.get(p.hour);
    if (list) list.push(p);
    else byHour.set(p.hour, [p]);
  }

  const hourlyAvgs: HourlyAvg[] = [];
  for (let hour = 0; hour < 24; hour++) {
    const hourPoints = byHour.get(hour);
    if (!hourPoints || hourPoints.length === 0) continue;

    const hourValues = hourPoints.map(p => p.value).sort((a, b) => a - b);
    const hourStart = new Date(hourPoints[0].datetime);
    hourStart.setMinutes(0, 0, 0);
    const days = new Set(hourPoints.map(p => p.datetime.toDateString()));

    hourlyAvgs.push({
      hour,
      avg: calculateLogAverage(hourValues),
      min: hourValues[0],
      max: hourValues[hourValues.length - 1],
      count: hourPoints.length,
      p5: getAcousticPercentile(hourValues, 5),
      p10: getAcousticPercentile(hourValues, 10),
      p90: getAcousticPercentile(hourValues, 90),
      p95: getAcousticPercentile(hourValues, 95),
      datetime: toLocalDateTime(hourStart),
      coverage: (hourPoints.length * interval) / HOUR_MS,
      multipleDays: days.size > 1,
    });
  }

  // Chronologicky podle skutečného času (u starých dat bez období podle hodiny)
  hourlyAvgs.sort((a, b) => (a.datetime! < b.datetime! ? -1 : a.datetime! > b.datetime! ? 1 : 0));

  const periodAvg = (hours: number[]): number =>
    calculateLogAverage(hourlyAvgs.filter(h => hours.includes(h.hour)).map(h => h.avg));

  const dayAvg = periodAvg(DAY_HOURS);
  const nightAvg = periodAvg(NIGHT_HOURS);

  return {
    min, max, avg, median, p10, p90, dayAvg, nightAvg, hourlyAvgs,
    window: window ?? undefined,
  };
}
