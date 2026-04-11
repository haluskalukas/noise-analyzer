// Stationary Noise Sources Types

export interface StationaryDataPoint {
  datetime: Date;
  laeq: number; // dB
  frequencies: number[]; // 31 frequencies from 20 Hz to 20000 Hz
}

export interface StationaryData {
  filename: string;
  date: Date;
  points: StationaryDataPoint[];
}

export interface StationarySource {
  id: string;
  name: string; // "Zdroj hluku" nebo "Hluk pozadí"
  type: 'source' | 'background';
  startTime: Date;
  endTime: Date;
  // Calculated values
  laeq: number; // Logarithmic average
  l5: number;
  l10: number;
  l90: number;
  l95: number;
  min: number;
  max: number;
  // Average frequencies (logarithmic average for each frequency)
  avgFrequencies: number[]; // 31 frequencies
  tonalComponents?: boolean[]; // 31 flags for tonal components
  startIndex: number;
  endIndex: number;
}

// Frequency list for stationary sources (1/3 octave bands)
export const STATIONARY_FREQUENCY_LIST = [
  20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160,
  200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600,
  2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500, 16000,
  20000
];

// Hearing threshold values for frequencies 20-160 Hz (dB)
export const HEARING_THRESHOLD: Record<number, number> = {
  20: 74,
  25: 64,
  31.5: 56,
  40: 49,
  50: 43,
  63: 42,
  80: 40,
  100: 38,
  125: 36,
  160: 34,
};
