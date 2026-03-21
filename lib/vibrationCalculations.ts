import { VibrationDataPoint, FREQUENCY_CORRECTIONS } from '@/types/vibration';

/**
 * Calculate RMS for a train pass on all frequencies and axes
 *
 * Process:
 * 1. For each frequency on each axis, across all time points:
 *    - Delogarithmize: lin = 10^(dB/10)
 *    - Square: squared = lin²
 *    - Sum: suma = Σ(squared)
 *    - Square root: rms_lin = √suma
 *    - Logarithmize: RMS_dB = 10 × log₁₀(rms_lin)
 *
 * 2. Apply corrections (add correction values in dB)
 *
 * @returns Object with rmsX, rmsY, rmsZ arrays (20 values each)
 */
export function calculateTrainRMS(points: VibrationDataPoint[]): {
  rmsX: number[];
  rmsY: number[];
  rmsZ: number[];
} {
  const numFreqs = 20;

  // Initialize sums for all 60 values (3 axes × 20 frequencies)
  const sumsSquared: number[] = new Array(60).fill(0);

  // Process each time point
  points.forEach(point => {
    for (let i = 0; i < 60; i++) {
      const dB = point.frequencies[i];
      // Delogarithmize and square
      const lin = Math.pow(10, dB / 10);
      const squared = lin * lin;
      sumsSquared[i] += squared;
    }
  });

  // Calculate RMS for each frequency and axis
  const rmsValues: number[] = [];
  for (let i = 0; i < 60; i++) {
    const rms_lin = Math.sqrt(sumsSquared[i]);
    const rms_dB = 10 * Math.log10(rms_lin);
    rmsValues.push(rms_dB);
  }

  // Apply corrections and split into axes
  const rmsX: number[] = [];
  const rmsY: number[] = [];
  const rmsZ: number[] = [];

  for (let f = 0; f < numFreqs; f++) {
    const correction = FREQUENCY_CORRECTIONS[f];

    // X axis: indices 0-19
    rmsX.push(rmsValues[f] + correction);

    // Y axis: indices 20-39
    rmsY.push(rmsValues[numFreqs + f] + correction);

    // Z axis: indices 40-59
    rmsZ.push(rmsValues[2 * numFreqs + f] + correction);
  }

  return { rmsX, rmsY, rmsZ };
}

/**
 * Calculate L_aw for one axis
 *
 * Process:
 * 1. Delogarithmize all 20 corrected RMS values: lin = 10^(RMS_corrected/10)
 * 2. Sum: suma = Σ(lin)
 * 3. Logarithmize: L_aw = 10 × log₁₀(suma)
 *
 * @param rmsValues Array of 20 corrected RMS values (dB)
 * @returns L_aw value (dB)
 */
export function calculateLaw(rmsValues: number[]): number {
  let sum = 0;

  rmsValues.forEach(rms_dB => {
    const lin = Math.pow(10, rms_dB / 10);
    sum += lin;
  });

  return 10 * Math.log10(sum);
}

/**
 * Calculate all vibration parameters for a train pass
 */
export function calculateTrainVibration(points: VibrationDataPoint[]): {
  rmsX: number[];
  rmsY: number[];
  rmsZ: number[];
  lawX: number;
  lawY: number;
  lawZ: number;
} {
  const { rmsX, rmsY, rmsZ } = calculateTrainRMS(points);

  return {
    rmsX,
    rmsY,
    rmsZ,
    lawX: calculateLaw(rmsX),
    lawY: calculateLaw(rmsY),
    lawZ: calculateLaw(rmsZ),
  };
}
