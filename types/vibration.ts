// Railway Vibration Types

export interface VibrationDataPoint {
  datetime: Date;
  no: number;
  // 60 frequency values: X (20 freqs) + Y (20 freqs) + Z (20 freqs)
  frequencies: number[]; // dB values
}

export interface VibrationData {
  filename: string;
  date: Date;
  points: VibrationDataPoint[];
  frequencyList: number[]; // [1, 1.25, 1.6, 2, 2.5, 3.15, 4, 5, 6.3, 8, 10, 12.5, 16, 20, 25, 31.5, 40, 50, 63, 80]
}

export interface VibrationTrain {
  id: string;
  startTime: Date;
  endTime: Date;
  trakce: string;
  druhVlaku: string;
  pocetVozu: string;
  smer: string;
  // Calculated values
  lawX: number; // L_aw for X axis (dB)
  lawY: number; // L_aw for Y axis (dB)
  lawZ: number; // L_aw for Z axis (dB)
  // RMS values for all frequencies (after correction)
  rmsX: number[]; // 20 frequencies
  rmsY: number[]; // 20 frequencies
  rmsZ: number[]; // 20 frequencies
  startIndex: number;
  endIndex: number;
}

// Correction values for frequencies (influence on humans in buildings)
export const FREQUENCY_CORRECTIONS = [
  -1.59, -0.85, -0.59, -0.61, -0.82,
  -1.19, -1.74, -2.5, -3.49, -4.7,
  -6.12, -7.71, -9.44, -11.25, -13.14,
  -15.09, -17.1, -19.23, -21.58, -24.38
];

export const FREQUENCY_LIST = [
  1, 1.25, 1.6, 2, 2.5, 3.15, 4, 5, 6.3, 8,
  10, 12.5, 16, 20, 25, 31.5, 40, 50, 63, 80
];

export const LIMIT_DB = 78.0;
