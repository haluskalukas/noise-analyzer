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
}

export interface TimeFilter {
  type: 'all' | 'day' | 'night' | 'custom';
  startHour?: number;
  endHour?: number;
}
