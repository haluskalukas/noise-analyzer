// Acoustic Calculations Library

/**
 * 1. Logarithmic sum of sound levels
 * Formula: L_sum = 10 × log₁₀(∑ 10^(Li/10))
 */
export function logarithmicSum(levels: number[]): number {
  const validLevels = levels.filter(l => !isNaN(l) && l > 0);
  if (validLevels.length === 0) return 0;

  const sum = validLevels.reduce((acc, level) => acc + Math.pow(10, level / 10), 0);
  return 10 * Math.log10(sum);
}

/**
 * 2. Logarithmic difference of sound levels (background noise correction)
 * Formula: L_diff = 10 × log₁₀(10^(L1/10) - ∑ 10^(Li/10))
 */
export function logarithmicDifference(totalLevel: number, levelsToSubtract: number[]): {
  result: number;
  difference: number;
  status: 'cannot_distinguish' | 'corrected' | 'no_correction';
} {
  const validLevels = levelsToSubtract.filter(l => !isNaN(l) && l > 0);
  if (validLevels.length === 0) {
    return {
      result: totalLevel,
      difference: 0,
      status: 'no_correction'
    };
  }

  const totalPower = Math.pow(10, totalLevel / 10);
  const subtractPower = validLevels.reduce((acc, level) => acc + Math.pow(10, level / 10), 0);

  const resultPower = totalPower - subtractPower;

  if (resultPower <= 0) {
    return {
      result: 0,
      difference: 0,
      status: 'cannot_distinguish'
    };
  }

  const result = 10 * Math.log10(resultPower);
  const difference = totalLevel - result;

  let status: 'cannot_distinguish' | 'corrected' | 'no_correction';
  if (difference < 3) {
    status = 'cannot_distinguish';
  } else if (difference >= 3 && difference < 10) {
    status = 'corrected';
  } else {
    status = 'no_correction';
  }

  return { result, difference, status };
}

/**
 * 3a. Distance attenuation from acoustic power (point source)
 * Formula: Lp = Lw + 10×log₁₀(Q/(4πr²))
 */
export function distanceAttenuationPoint(lw: number, q: number, r: number): number {
  if (r <= 0) return 0;
  return lw + 10 * Math.log10(q / (4 * Math.PI * r * r));
}

/**
 * 3b. Distance attenuation - point source (distance change)
 * Formula: Lp2 = Lp1 + 20×log₁₀(r1/r2)
 */
export function distanceChangePoint(lp1: number, r1: number, r2: number): number {
  if (r2 <= 0) return 0;
  return lp1 + 20 * Math.log10(r1 / r2);
}

/**
 * 3c. Distance attenuation - linear source (distance change)
 * Formula: Lp2 = Lp1 + 10×log₁₀(r1/r2)
 */
export function distanceChangeLinear(lp1: number, r1: number, r2: number): number {
  if (r2 <= 0) return 0;
  return lp1 + 10 * Math.log10(r1 / r2);
}

/**
 * 3d. Distance attenuation - linear source of finite length
 * Formula: Lp = Lw + 10×log₁₀(arctg(a/d)) - 10×log₁₀(4π×a×d)
 */
export function linearSourceFiniteLength(lw: number, a: number, d: number): number {
  if (a <= 0 || d <= 0) return 0;
  return lw + 10 * Math.log10(Math.atan(a / d)) - 10 * Math.log10(4 * Math.PI * a * d);
}

/**
 * 3e. Distance attenuation - surface source with reflection
 * Formula: Lp = Lw - 10×log₁₀(S + 4πr²/Q)
 */
export function surfaceSourceWithReflection(lw: number, s: number, q: number, r: number): number {
  if (q <= 0) return 0;
  return lw - 10 * Math.log10(s + (4 * Math.PI * r * r) / q);
}

/**
 * 3f. Distance attenuation - surface source only
 * Formula: Lp = Lw - 10×log₁₀(S)
 */
export function surfaceSourceOnly(lw: number, s: number): number {
  if (s <= 0) return 0;
  return lw - 10 * Math.log10(s);
}

/**
 * 4. Exposure duration correction (single source)
 * Formula: LAeq,T = 10×log₁₀((10^(LAeq,t/10) × t) / T)
 */
export function exposureDurationCorrection(laeqT: number, t: number, referenceT: number): number {
  if (referenceT <= 0) return 0;
  const power = Math.pow(10, laeqT / 10);
  return 10 * Math.log10((power * t) / referenceT);
}

/**
 * 5. Average exposure (logarithmic average)
 * Formula: LAeq = 10×log₁₀(1/n × ∑ 10^(Li/10))
 */
export function averageExposure(levels: number[]): number {
  const validLevels = levels.filter(l => !isNaN(l) && l > 0);
  if (validLevels.length === 0) return 0;

  const sum = validLevels.reduce((acc, level) => acc + Math.pow(10, level / 10), 0);
  return 10 * Math.log10(sum / validLevels.length);
}

/**
 * 6. Multiple sources with different exposure durations
 * Formula: LAeq,T = 10×log₁₀((∑(10^(Li/10) × ti)) / T)
 */
export function multipleSourcesDuration(
  sources: Array<{ laeq: number; duration: number }>,
  referenceT: number
): number {
  if (referenceT <= 0) return 0;

  const validSources = sources.filter(s => !isNaN(s.laeq) && s.laeq > 0 && s.duration > 0);
  if (validSources.length === 0) return 0;

  const sum = validSources.reduce(
    (acc, source) => acc + Math.pow(10, source.laeq / 10) * source.duration,
    0
  );

  return 10 * Math.log10(sum / referenceT);
}

/**
 * 7. Sound insulation of composite construction
 * Formula: R'w,res = 10×log₁₀(S_total) - 10×log₁₀(∑(Si × 10^(-Rwi/10)))
 */
export function compositeSoundInsulation(
  elements: Array<{ rw: number; area: number }>
): number {
  const validElements = elements.filter(e => !isNaN(e.rw) && !isNaN(e.area) && e.area > 0);
  if (validElements.length === 0) return 0;

  const totalArea = validElements.reduce((acc, el) => acc + el.area, 0);
  const sum = validElements.reduce(
    (acc, el) => acc + el.area * Math.pow(10, -el.rw / 10),
    0
  );

  return 10 * Math.log10(totalArea) - 10 * Math.log10(sum);
}

/**
 * Format number to specified decimal places
 */
export function formatResult(value: number, decimals: number = 1): string {
  if (isNaN(value) || !isFinite(value)) return '—';
  return value.toFixed(decimals);
}
