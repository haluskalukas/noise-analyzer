import { StationaryDataPoint, HEARING_THRESHOLD } from '@/types/stationary';

/**
 * Calculate logarithmic average (Leq) from dB values
 */
export function calculateLeq(values: number[]): number {
  if (values.length === 0) return 0;

  const sum = values.reduce((acc, val) => acc + Math.pow(10, val / 10), 0);
  return 10 * Math.log10(sum / values.length);
}

/**
 * Calculate percentile for acoustic notation
 * L5 = 5% of time noise is HIGHER (95th percentile in statistics)
 * L95 = 95% of time noise is HIGHER (5th percentile in statistics)
 */
export function calculateAcousticPercentile(values: number[], percent: number): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => b - a); // Sort descending
  const index = Math.ceil((percent / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

/**
 * Calculate logarithmic average for each frequency across multiple measurements
 */
export function calculateFrequencyAverages(points: StationaryDataPoint[]): number[] {
  if (points.length === 0) return Array(31).fill(0);

  const numFrequencies = 31;
  const avgFrequencies: number[] = [];

  for (let freqIndex = 0; freqIndex < numFrequencies; freqIndex++) {
    const freqValues = points.map(p => p.frequencies[freqIndex]);
    avgFrequencies.push(calculateLeq(freqValues));
  }

  return avgFrequencies;
}

/**
 * Detect tonal components in frequency spectrum
 * Tonal component: frequency band >5 dB higher than both neighbors
 * Can be in one or two adjacent bands
 * AND (for 10-160 Hz) level higher than hearing threshold
 */
export function detectTonalComponents(avgFrequencies: number[], frequencyList: number[]): boolean[] {
  const tonalComponents = Array(avgFrequencies.length).fill(false);

  for (let i = 1; i < avgFrequencies.length - 1; i++) {
    const current = avgFrequencies[i];
    const prev = avgFrequencies[i - 1];
    const next = avgFrequencies[i + 1];
    const freq = frequencyList[i];

    // Check if >5 dB higher than both neighbors
    const higherThanNeighbors = current > prev + 5 && current > next + 5;

    if (higherThanNeighbors) {
      // For frequencies 10-160 Hz, also check hearing threshold
      if (freq >= 10 && freq <= 160) {
        const threshold = HEARING_THRESHOLD[freq];
        if (threshold !== undefined && current > threshold) {
          tonalComponents[i] = true;
        }
      } else {
        // For other frequencies, just the neighbor check is enough
        tonalComponents[i] = true;
      }
    }
  }

  // Check for two adjacent tonal bands (can both be >5 dB if they form a peak together)
  for (let i = 1; i < avgFrequencies.length - 2; i++) {
    const current = avgFrequencies[i];
    const next = avgFrequencies[i + 1];
    const prev = avgFrequencies[i - 1];
    const afterNext = avgFrequencies[i + 2];
    const freq1 = frequencyList[i];
    const freq2 = frequencyList[i + 1];

    // Both current and next are high, and higher than outer neighbors
    const bothHigherThanOuter = current > prev + 5 && next > afterNext + 5;
    const similarLevels = Math.abs(current - next) <= 3; // They're close to each other

    if (bothHigherThanOuter && similarLevels) {
      // Check hearing threshold for both if applicable
      let valid1 = true;
      let valid2 = true;

      if (freq1 >= 10 && freq1 <= 160) {
        const threshold = HEARING_THRESHOLD[freq1];
        if (threshold !== undefined) {
          valid1 = current > threshold;
        }
      }

      if (freq2 >= 10 && freq2 <= 160) {
        const threshold = HEARING_THRESHOLD[freq2];
        if (threshold !== undefined) {
          valid2 = next > threshold;
        }
      }

      if (valid1 && valid2) {
        tonalComponents[i] = true;
        tonalComponents[i + 1] = true;
      }
    }
  }

  return tonalComponents;
}

/**
 * Calculate all statistics for a selection of data points
 */
export function calculateStationaryStats(points: StationaryDataPoint[]) {
  if (points.length === 0) {
    return {
      laeq: 0,
      l5: 0,
      l10: 0,
      l50: 0,
      l90: 0,
      l95: 0,
      min: 0,
      max: 0,
      avgFrequencies: Array(31).fill(0),
    };
  }

  const laeqValues = points.map(p => p.laeq);

  return {
    laeq: calculateLeq(laeqValues),
    l5: calculateAcousticPercentile(laeqValues, 5),
    l10: calculateAcousticPercentile(laeqValues, 10),
    l50: calculateAcousticPercentile(laeqValues, 50),
    l90: calculateAcousticPercentile(laeqValues, 90),
    l95: calculateAcousticPercentile(laeqValues, 95),
    min: Math.min(...laeqValues),
    max: Math.max(...laeqValues),
    avgFrequencies: calculateFrequencyAverages(points),
  };
}
