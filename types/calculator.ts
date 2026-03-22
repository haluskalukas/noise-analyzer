// Acoustic Calculator Types

export interface LogSumInput {
  levels: number[]; // dB values (up to 6)
}

export interface LogDiffInput {
  totalLevel: number; // L1 (dB)
  levelsToSubtract: number[]; // L2-L6 (dB)
}

export interface DistanceAttenuationPointInput {
  lw: number; // acoustic power (dB)
  q: number; // directivity factor
  r: number; // distance (m)
}

export interface DistanceChangePointInput {
  lp1: number; // initial sound pressure level (dB)
  r1: number; // initial distance (m)
  r2: number; // new distance (m)
}

export interface DistanceChangeLinearInput {
  lp1: number; // initial sound pressure level (dB)
  r1: number; // initial distance (m)
  r2: number; // new distance (m)
}

export interface LinearSourceInput {
  lw: number; // acoustic power (dB)
  a: number; // source length (m)
  d: number; // perpendicular distance (m)
}

export interface SurfaceSourceWithReflectionInput {
  lw: number; // acoustic power (dB)
  s: number; // surface area (m²)
  q: number; // directivity factor
  r: number; // distance (m)
}

export interface SurfaceSourceInput {
  lw: number; // acoustic power (dB)
  s: number; // surface area (m²)
}

export interface ExposureDurationInput {
  laeqT: number; // measured level for time t (dB)
  t: number; // exposure time (hours or minutes)
  referenceT: number; // reference time interval (hours or minutes)
}

export interface AverageExposureInput {
  levels: number[]; // measured levels (dB)
}

export interface MultipleSourcesInput {
  sources: Array<{
    laeq: number; // level (dB)
    duration: number; // duration (minutes)
  }>;
  referenceT: number; // total reference interval (minutes)
}

export interface SoundInsulationElement {
  name: string;
  rw: number; // weighted sound reduction index (dB)
  area: number; // area (m²)
}

export interface SoundInsulationInput {
  elements: SoundInsulationElement[];
}

// Calculator results
export interface CalculatorResult {
  value: number;
  unit: string;
  formula?: string;
  description?: string;
}

// Directivity factors
export const DIRECTIVITY_FACTORS = {
  FREE_FIELD: 1, // omnidirectional in free space
  HALF_SPACE: 2, // on ground
  QUARTER_SPACE: 4, // corner of room
  EIGHTH_SPACE: 8, // corner on ground
};

export const DIRECTIVITY_LABELS: Record<number, string> = {
  1: 'Volný prostor (všesměrový)',
  2: 'Poloprostor (na zemi)',
  4: 'Čtvrt prostoru (roh místnosti)',
  8: 'Osmina prostoru (roh na zemi)',
};
