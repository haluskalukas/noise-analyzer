// Noise Analyzer Types

export interface NoiseDataPoint {
  datetime: Date;
  value: number; // dB
  hour: number;
  minute: number;
}

export interface NoiseData {
  filename: string;
  date: Date;
  points: NoiseDataPoint[];
  stats: NoiseStats;
}

export interface NoiseStats {
  min: number;
  max: number;
  avg: number;
  median: number;
  p10: number; // 10th percentile
  p90: number; // 90th percentile
  dayAvg: number; // 6:00-22:00
  nightAvg: number; // 22:00-6:00
  hourlyAvgs: HourlyAvg[];
  window?: EvalWindow; // období vyhodnocení, ze kterého jsou statistiky
}

// Období vyhodnocení, místní čas "YYYY-MM-DDTHH:MM", interval [from, to)
export interface EvalWindow {
  from: string;
  to: string;
}

export interface HourlyAvg {
  hour: number;
  avg: number;
  min: number;
  max: number;
  count: number;
  p5: number;   // 5th percentile
  p10: number;  // 10th percentile
  p90: number;  // 90th percentile
  p95: number;  // 95th percentile
  datetime?: string;      // začátek hodiny "YYYY-MM-DDTHH:00" (místní čas)
  coverage?: number;      // podíl hodiny pokrytý daty po vymazání ruchů (0–1)
  multipleDays?: boolean; // hodina obsahuje data z více dnů (jen bez období vyhodnocení)
}

export interface TimeFilter {
  type: 'all' | 'day' | 'night' | 'custom';
  startHour?: number;
  endHour?: number;
}
