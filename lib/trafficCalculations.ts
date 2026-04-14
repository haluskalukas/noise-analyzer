import { HourlyTrafficCount, TrafficSummary, GroupedTrafficSummary } from '@/types/traffic';

/**
 * Calculate traffic summary from hourly counts
 */
export function calculateTrafficSummary(hourlyCounts: HourlyTrafficCount[]): TrafficSummary {
  const dayCounts = { OA: 0, LN: 0, N: 0, A: 0, M: 0, K: 0 };
  const nightCounts = { OA: 0, LN: 0, N: 0, A: 0, M: 0, K: 0 };
  const totalCounts = { OA: 0, LN: 0, N: 0, A: 0, M: 0, K: 0 };

  hourlyCounts.forEach(({ hour, OA, LN, N, A, M, K }) => {
    const isDay = hour >= 6 && hour < 22;

    if (isDay) {
      dayCounts.OA += OA;
      dayCounts.LN += LN;
      dayCounts.N += N;
      dayCounts.A += A;
      dayCounts.M += M;
      dayCounts.K += K;
    } else {
      nightCounts.OA += OA;
      nightCounts.LN += LN;
      nightCounts.N += N;
      nightCounts.A += A;
      nightCounts.M += M;
      nightCounts.K += K;
    }

    totalCounts.OA += OA;
    totalCounts.LN += LN;
    totalCounts.N += N;
    totalCounts.A += A;
    totalCounts.M += M;
    totalCounts.K += K;
  });

  return {
    day: dayCounts,
    night: nightCounts,
    total: totalCounts,
  };
}

/**
 * Calculate grouped traffic summary (3 categories)
 */
export function calculateGroupedSummary(summary: TrafficSummary): GroupedTrafficSummary {
  return {
    day: {
      category1: summary.day.OA + summary.day.LN + summary.day.M,
      category2: summary.day.A + summary.day.N,
      category3: summary.day.K,
    },
    night: {
      category1: summary.night.OA + summary.night.LN + summary.night.M,
      category2: summary.night.A + summary.night.N,
      category3: summary.night.K,
    },
    total: {
      category1: summary.total.OA + summary.total.LN + summary.total.M,
      category2: summary.total.A + summary.total.N,
      category3: summary.total.K,
    },
  };
}

/**
 * Calculate TP 189 grouped summary (5 categories dle TP 189)
 * O = Osobní vozidla (OA + LN)
 * M = Motocykly
 * N = Nákladní vozidla
 * A = Autobusy
 * K = Nákladní soupravy
 */
export function calculateTP189GroupedSummary(summary: TrafficSummary) {
  return {
    day: {
      O: summary.day.OA + summary.day.LN,  // Osobní vozidla
      M: summary.day.M,                     // Motocykly
      N: summary.day.N,                     // Nákladní
      A: summary.day.A,                     // Autobusy
      K: summary.day.K,                     // Kamiony
    },
    night: {
      O: summary.night.OA + summary.night.LN,
      M: summary.night.M,
      N: summary.night.N,
      A: summary.night.A,
      K: summary.night.K,
    },
    total: {
      O: summary.total.OA + summary.total.LN,
      M: summary.total.M,
      N: summary.total.N,
      A: summary.total.A,
      K: summary.total.K,
    },
  };
}

/**
 * Initialize empty hourly counts (24 hours)
 */
export function initializeHourlyCounts(): HourlyTrafficCount[] {
  return Array.from({ length: 24 }, (_, hour) => ({
    hour,
    OA: 0,
    LN: 0,
    N: 0,
    A: 0,
    M: 0,
    K: 0,
  }));
}
