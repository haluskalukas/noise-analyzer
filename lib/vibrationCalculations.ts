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

  console.log('--- KROK 1: Zpracování bodů ---');
  console.log(`Čas prvního bodu: ${points[0]?.datetime.toLocaleTimeString()}`);
  console.log(`Čas posledního bodu: ${points[points.length - 1]?.datetime.toLocaleTimeString()}`);
  console.log('');

  console.log('Surové hodnoty z prvního bodu pro osu Z (indexy 40-59):');
  for (let i = 40; i < 60; i++) {
    const freqIndex = i - 40;
    const freq = [1, 1.25, 1.6, 2, 2.5, 3.15, 4, 5, 6.3, 8, 10, 12.5, 16, 20, 25, 31.5, 40, 50, 63, 80][freqIndex];
    console.log(`  f=${freq} Hz: ${points[0].frequencies[i].toFixed(2)} dB`);
  }
  console.log('');

  console.log('Zpracování všech bodů (ukázka 1 Hz na ose Z, index 40):');
  // Process each time point
  points.forEach((point, pointIdx) => {
    for (let i = 0; i < 60; i++) {
      const dB = point.frequencies[i];
      // Delogarithmize and square
      const lin = Math.pow(10, dB / 10);
      const squared = lin * lin;
      sumsSquared[i] += squared;

      // Log prvních pár bodů pro frekvenci 1 Hz na ose Z (index 40)
      if (i === 40 && pointIdx < 5) {
        console.log(`  Bod ${pointIdx + 1} (${point.datetime.toLocaleTimeString()}): dB=${dB.toFixed(2)} → lin=${lin.toFixed(4)} → ²=${squared.toFixed(4)}`);
      }
    }
  });
  console.log(`... celkem ${points.length} bodů zpracováno`);
  console.log('');

  // Calculate RMS for each frequency and axis
  const rmsValues: number[] = [];

  console.log('--- KROK 2: Výpočet RMS pro osu Z (před korekcí) ---');
  for (let i = 0; i < 60; i++) {
    const rms_lin = Math.sqrt(sumsSquared[i]);
    const rms_dB = 10 * Math.log10(rms_lin);
    rmsValues.push(rms_dB);

    // Log pouze pro osu Z (indexy 40-59)
    if (i >= 40 && i < 60) {
      const freqIndex = i - 40;
      const freq = [1, 1.25, 1.6, 2, 2.5, 3.15, 4, 5, 6.3, 8, 10, 12.5, 16, 20, 25, 31.5, 40, 50, 63, 80][freqIndex];
      console.log(`f=${freq} Hz: suma²=${sumsSquared[i].toFixed(2)} → √=${rms_lin.toFixed(4)} → RMS=${rms_dB.toFixed(2)} dB`);
    }
  }
  console.log('');

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

  // Debug logging
  const startTime = points[0]?.datetime;
  const endTime = points[points.length - 1]?.datetime;

  console.log('=== VÝPOČET VIBRACÍ ===');
  console.log(`Čas: ${startTime?.toLocaleTimeString()} - ${endTime?.toLocaleTimeString()}`);
  console.log(`Počet bodů: ${points.length}`);
  console.log('');

  console.log('--- OSA Z - RMS hodnoty (po korekci) ---');
  rmsZ.forEach((rms, i) => {
    const freq = [1, 1.25, 1.6, 2, 2.5, 3.15, 4, 5, 6.3, 8, 10, 12.5, 16, 20, 25, 31.5, 40, 50, 63, 80][i];
    const correction = FREQUENCY_CORRECTIONS[i];
    console.log(`f=${freq} Hz: RMS=${rms.toFixed(2)} dB (korekce=${correction.toFixed(2)} dB)`);
  });
  console.log('');

  console.log('--- VÝPOČET Law_Z ---');
  let sumLin = 0;
  rmsZ.forEach((rms, i) => {
    const freq = [1, 1.25, 1.6, 2, 2.5, 3.15, 4, 5, 6.3, 8, 10, 12.5, 16, 20, 25, 31.5, 40, 50, 63, 80][i];
    const lin = Math.pow(10, rms / 10);
    sumLin += lin;
    console.log(`f=${freq} Hz: RMS=${rms.toFixed(2)} dB → lin=${lin.toFixed(4)}`);
  });
  const lawZ = 10 * Math.log10(sumLin);
  console.log(`Suma lin: ${sumLin.toFixed(4)}`);
  console.log(`Law_Z = 10 × log₁₀(${sumLin.toFixed(4)}) = ${lawZ.toFixed(2)} dB`);
  console.log('');

  return {
    rmsX,
    rmsY,
    rmsZ,
    lawX: calculateLaw(rmsX),
    lawY: calculateLaw(rmsY),
    lawZ: lawZ,
  };
}
