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
 * Calculate TP 189 grouped summary from RPDI results
 * Seskupení 3 kategorií z RPDI hodnot:
 * Kategorie 1: OA + LN + M
 * Kategorie 2: A + N
 * Kategorie 3: K
 */
export function calculateTP189GroupedSummary(rpdiResult: any) {
  if (!rpdiResult) {
    return {
      day: { category1: 0, category2: 0, category3: 0 },
      night: { category1: 0, category2: 0, category3: 0 },
      total: { category1: 0, category2: 0, category3: 0 },
    };
  }

  return {
    day: {
      category1: rpdiResult.categories.OA.day.RPDI +
                 rpdiResult.categories.LN.day.RPDI +
                 rpdiResult.categories.M.day.RPDI,
      category2: rpdiResult.categories.A.day.RPDI +
                 rpdiResult.categories.N.day.RPDI,
      category3: rpdiResult.categories.K.day.RPDI,
    },
    night: {
      category1: rpdiResult.categories.OA.night.RPDI +
                 rpdiResult.categories.LN.night.RPDI +
                 rpdiResult.categories.M.night.RPDI,
      category2: rpdiResult.categories.A.night.RPDI +
                 rpdiResult.categories.N.night.RPDI,
      category3: rpdiResult.categories.K.night.RPDI,
    },
    total: {
      category1: rpdiResult.categories.OA.total.RPDI +
                 rpdiResult.categories.LN.total.RPDI +
                 rpdiResult.categories.M.total.RPDI,
      category2: rpdiResult.categories.A.total.RPDI +
                 rpdiResult.categories.N.total.RPDI,
      category3: rpdiResult.categories.K.total.RPDI,
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
