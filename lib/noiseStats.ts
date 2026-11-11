import { NoiseDataPoint, NoiseStats, HourlyAvg } from '@/types';

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

/**
 * Statistiky měření.
 *
 * Den (6–22 h) a noc (22–6 h) se počítají jako energetický průměr HODINOVÝCH LAeq,
 * každá hodina má stejnou váhu. Hodina, ze které byly vymazány ruchy, tak dál
 * zastupuje celou hodinu (LAeq zbytku hodiny = LAeq hodiny).
 * Dříve se průměrovaly všechny zbylé sekundy, takže hodiny s větším vymazaným
 * úsekem měly menší váhu (např. Z 2026-222 M6 noc 50,0 místo 50,2 dB).
 */
export function calculateStats(points: NoiseDataPoint[]): NoiseStats {
  const values = points.map(p => p.value).sort((a, b) => a - b);

  const min = values[0];
  const max = values[values.length - 1];
  const avg = calculateLogAverage(points.map(p => p.value));
  const median = values[Math.floor(values.length / 2)];
  const p10 = getAcousticPercentile(values, 10);
  const p90 = getAcousticPercentile(values, 90);

  const hourlyAvgs: HourlyAvg[] = [];
  for (let hour = 0; hour < 24; hour++) {
    const hourPoints = points.filter(p => p.hour === hour);
    if (hourPoints.length === 0) continue;

    const hourValues = hourPoints.map(p => p.value).sort((a, b) => a - b);
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
    });
  }

  const periodAvg = (hours: number[]): number =>
    calculateLogAverage(hourlyAvgs.filter(h => hours.includes(h.hour)).map(h => h.avg));

  const dayAvg = periodAvg(DAY_HOURS);
  const nightAvg = periodAvg(NIGHT_HOURS);

  return { min, max, avg, median, p10, p90, dayAvg, nightAvg, hourlyAvgs };
}
