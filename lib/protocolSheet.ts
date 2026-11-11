import { NoiseStats, HourlyAvg } from '@/types';
import { HourlyTrafficCount } from '@/types/traffic';
import type { WeatherData } from '@/components/Weather';
import { LOW_COVERAGE } from '@/lib/noiseStats';

/**
 * List „Protokol“ v exportu automobilové dopravy: tabulky ve stejném tvaru
 * a pořadí jako v protokolu o měření, aby šly bloky rovnou zkopírovat.
 * Výsledky se skládají ze zaokrouhlených hodnot (0,1 dB) stejně jako v protokolu.
 */

export interface ProtocolSheetInput {
  address: string;
  stats: NoiseStats;
  trafficCounts: HourlyTrafficCount[];
  weatherData: WeatherData[];
  startHour: number; // hodina, kterou začínají tabulky (když není období vyhodnocení)
  reflectionCorrection: number; // -2 nebo 0
  rpdiCorrectionDay: number;
  rpdiCorrectionNight: number;
  uncertainty: number;
  roadBefore2001: boolean;
}

export interface ProtocolResults {
  measuredDay: number;
  measuredNight: number;
  calculatedDay: number; // dopočtená = naměřená + odraz + RPDI
  calculatedNight: number;
  finalDay: number; // výsledná = dopočtená − nejistota
  finalNight: number;
  limitDay: number;
  limitNight: number;
  exceedsDay: boolean;
  exceedsNight: boolean;
}

type Cell = string | number;

const round1 = (n: number) => Math.round(n * 10) / 10;
const cz = (n: number) => n.toFixed(1).replace('.', ',');
const czSigned = (n: number) => (n > 0 ? '+' : '') + cz(n);
const WIND_DIRECTIONS = ['S', 'SV', 'V', 'JV', 'J', 'JZ', 'Z', 'SZ'];

const BASE_LEVEL = 50;
const CORRECTION_OLD_ROAD = 18; // komunikace umístěné nebo povolené před 1. 1. 2001
const CORRECTION_MAIN_ROAD = 10; // komunikace umístěné nebo povolené po 31. 12. 2000
const NIGHT_CORRECTION = -10;

export const VERDICT_EXCEEDED = 'Hygienický limit je prokazatelně překročen';
export const VERDICT_NOT_EXCEEDED = 'Hygienický limit není prokazatelně překročen';

/** Výsledky se zaokrouhlením po krocích jako v protokolu. */
export function protocolResults(
  stats: NoiseStats,
  reflectionCorrection: number,
  rpdiCorrectionDay: number,
  rpdiCorrectionNight: number,
  uncertainty: number,
  roadBefore2001: boolean,
): ProtocolResults {
  const measuredDay = round1(stats.dayAvg);
  const measuredNight = round1(stats.nightAvg);
  const calculatedDay = round1(measuredDay + reflectionCorrection + rpdiCorrectionDay);
  const calculatedNight = round1(measuredNight + reflectionCorrection + rpdiCorrectionNight);
  const finalDay = round1(calculatedDay - uncertainty);
  const finalNight = round1(calculatedNight - uncertainty);
  const correction = roadBefore2001 ? CORRECTION_OLD_ROAD : CORRECTION_MAIN_ROAD;
  const limitDay = BASE_LEVEL + correction;
  const limitNight = BASE_LEVEL + correction + NIGHT_CORRECTION;
  return {
    measuredDay, measuredNight, calculatedDay, calculatedNight, finalDay, finalNight,
    limitDay, limitNight,
    exceedsDay: finalDay > limitDay,
    exceedsNight: finalNight > limitNight,
  };
}

/** "YYYY-MM-DD…" -> "23. 9. 2026" */
const czDate = (s: string) => {
  const [y, m, d] = s.slice(0, 10).split('-').map(Number);
  return `${d}. ${m}. ${y}`;
};

/** Pořadí hodin 0–23 začínající danou hodinou. */
const hourOrder = (start: number) => Array.from({ length: 24 }, (_, i) => (start + i) % 24);

export function buildProtocolSheet(input: ProtocolSheetInput): Cell[][] {
  const { stats, trafficCounts, weatherData, address } = input;
  const start = stats.window ? Number(stats.window.from.slice(11, 13)) : input.startHour;
  const order = hourOrder(start);
  const r = protocolResults(
    stats, input.reflectionCorrection, input.rpdiCorrectionDay, input.rpdiCorrectionNight,
    input.uncertainty, input.roadBefore2001,
  );
  const rows: Cell[][] = [];
  const blank = () => rows.push([]);

  rows.push(['TABULKY DO PROTOKOLU']);
  rows.push([address]);
  if (stats.window) {
    rows.push([`Období vyhodnocení: ${stats.window.from.replace('T', ' ')} – ${stats.window.to.replace('T', ' ')}`]);
  }
  blank();

  // ----- Meteorologické podmínky (po hodinách) -----
  if (weatherData.length > 0) {
    rows.push(['Přehled meteorologických podmínek během měření']);
    rows.push(['datum', 'čas', 't (°C)', 'Rh (%)', 'Pn (hPa)', 'v (km/h)', 'směr větru (-)']);
    const ordered = weatherData.every(w => !!w.datetime)
      ? [...weatherData].sort((a, b) => (a.datetime! < b.datetime! ? -1 : 1))
      : order.map(h => weatherData.find(w => w.hour === h)).filter((w): w is WeatherData => !!w);
    let lastDate = '';
    for (const w of ordered) {
      const date = w.datetime ? czDate(w.datetime) : '';
      rows.push([
        date !== lastDate ? date : '',
        `${w.hour}:00`,
        cz(w.temperature),
        w.humidity,
        cz(w.pressure),
        cz(w.windSpeed),
        WIND_DIRECTIONS[Math.round(w.windDirection / 45) % 8],
      ]);
      lastDate = date;
    }
    blank();
  }

  // ----- Dopravně inženýrský průzkum -----
  rows.push(['Dopravně inženýrský průzkum']);
  rows.push(['hodina', '', '', 'OA', 'LN', 'TN', 'A', 'M', 'K']);
  const sums = { day: [0, 0, 0, 0, 0, 0], night: [0, 0, 0, 0, 0, 0] };
  for (const h of order) {
    const t = trafficCounts.find(c => c.hour === h);
    if (!t) continue;
    const v = [t.OA, t.LN, t.N, t.A, t.M, t.K];
    const target = h >= 6 && h < 22 ? sums.day : sums.night;
    v.forEach((x, i) => (target[i] += x));
    rows.push([`${h}:00`, '-', `${(h + 1) % 24}:00`, ...v]);
  }
  rows.push(['denní doba', '', '', ...sums.day]);
  rows.push(['noční doba', '', '', ...sums.night]);
  blank();

  // ----- Naměřené hodnoty -----
  rows.push(['Naměřené hodnoty']);
  rows.push(['hodina', '', '', 'LAeq,T (dB)', 'L5 (dB)', 'L10 (dB)', 'L90 (dB)', 'L95 (dB)']);
  const hourly: HourlyAvg[] = stats.hourlyAvgs.every(h => !!h.datetime) && stats.window
    ? stats.hourlyAvgs
    : order.map(h => stats.hourlyAvgs.find(x => x.hour === h)).filter((x): x is HourlyAvg => !!x);
  for (const h of hourly) {
    rows.push([`${h.hour}:00`, '-', `${(h.hour + 1) % 24}:00`, cz(h.avg), cz(h.p5), cz(h.p10), cz(h.p90), cz(h.p95)]);
  }
  rows.push(['denní doba LAeq,T (dB)', '', '', cz(r.measuredDay)]);
  rows.push(['noční doba LAeq,T (dB)', '', '', cz(r.measuredNight)]);
  const low = hourly.filter(h => (h.coverage ?? 1) < LOW_COVERAGE);
  if (low.length > 0) {
    rows.push([
      `Pozn. (do protokolu nekopírovat): hodiny s daty pod ${Math.round(LOW_COVERAGE * 100)} %: ` +
        low.map(h => `${h.hour}:00 (${Math.round((h.coverage ?? 0) * 100)} %)`).join(', '),
    ]);
  }
  blank();

  // ----- Souhrn naměřených hodnot včetně korekcí -----
  rows.push(['Souhrn naměřených hodnot včetně uplatněných korekcí']);
  rows.push([
    'měřicí místo', 'naměřená hodnota (dB)', '', 'korekce na odraz (dB)', '',
    'korekce na RPDI (dB)', '', 'nejistota měření (dB)', '', 'výsledná hodnota (dB)', '',
  ]);
  rows.push(['', 'den', 'noc', 'den', 'noc', 'den', 'noc', 'den', 'noc', 'den', 'noc']);
  rows.push([
    address,
    cz(r.measuredDay), cz(r.measuredNight),
    cz(input.reflectionCorrection), cz(input.reflectionCorrection),
    cz(input.rpdiCorrectionDay), cz(input.rpdiCorrectionNight),
    cz(-input.uncertainty), cz(-input.uncertainty),
    cz(r.finalDay), cz(r.finalNight),
  ]);
  blank();

  // ----- Hodnocení měření -----
  const correctionLabel = input.roadBefore2001
    ? 'korekce pro komunikace umístěné nebo povolené před 1. lednem 2001 (dB)'
    : 'korekce pro komunikace umístěné nebo povolené po 31. prosinci 2000 (dB)';
  const correction = input.roadBefore2001 ? CORRECTION_OLD_ROAD : CORRECTION_MAIN_ROAD;

  rows.push(['Hodnocení měření']);
  rows.push([address]);
  rows.push(['druh chráněného prostoru', 'CHVePS']);
  rows.push(['denní doba']);
  rows.push(['základní hladina akustického tlaku A LAeq,T (dB)', correctionLabel, 'stanovený hygienický limit (dB)']);
  rows.push([cz(BASE_LEVEL), czSigned(correction), cz(r.limitDay)]);
  rows.push(['výsledná dopočtená hladina hluku, stanovena pro denní dobu LAeq,16h', cz(r.calculatedDay)]);
  rows.push(['kombinovaná rozšířená nejistota měření', `± ${cz(input.uncertainty)}`]);
  rows.push(['výsledná hodnota dopočtené hladiny po odečtení nejistoty měření, stanovena pro denní dobu LAeq,16h', cz(r.finalDay)]);
  rows.push([r.exceedsDay ? VERDICT_EXCEEDED : VERDICT_NOT_EXCEEDED]);
  blank();
  rows.push(['druh chráněného prostoru', 'CHVePS']);
  rows.push(['noční doba']);
  rows.push([
    'základní hladina akustického tlaku A LAeq,T (dB)', correctionLabel,
    'korekce na noční dobu (dB)', 'stanovený hygienický limit (dB)',
  ]);
  rows.push([cz(BASE_LEVEL), czSigned(correction), czSigned(NIGHT_CORRECTION), cz(r.limitNight)]);
  rows.push(['výsledná dopočtená hladina hluku, stanovena pro noční dobu LAeq,8h', cz(r.calculatedNight)]);
  rows.push(['kombinovaná rozšířená nejistota měření', `± ${cz(input.uncertainty)}`]);
  rows.push(['výsledná hodnota dopočtené hladiny po odečtení nejistoty měření, stanovena pro noční dobu LAeq,8h', cz(r.finalNight)]);
  rows.push([r.exceedsNight ? VERDICT_EXCEEDED : VERDICT_NOT_EXCEEDED]);

  return rows;
}
