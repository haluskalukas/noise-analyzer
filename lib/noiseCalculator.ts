/**
 * Výpočet hladiny hluku z dopravy podle české metodiky
 * ČSN ISO 9613-2 a Ministerstvo dopravy ČR
 */

export interface NoiseCalculationInput {
  category1: number; // OA + LN + M (počet vozidel za období)
  category2: number; // N + A (počet vozidel za období)
  category3: number; // K (počet vozidel za období)
  speed: number; // rychlost v km/h
  distance?: number; // vzdálenost v metrech (defaultně 7.5m)
}

export interface NoiseCalculationResult {
  LAeq: number; // výsledná hladina hluku v dB(A)
  contributions: {
    category1: number; // příspěvek kategorie 1
    category2: number; // příspěvek kategorie 2
    category3: number; // příspěvek kategorie 3
  };
}

/**
 * Emisní hladiny akustického výkonu pro jednotlivé kategorie
 * při referenční rychlosti 50 km/h
 */
const EMISSION_LEVELS = {
  category1: 63, // OA + LN + M [dB(A)]
  category2: 74, // N + A [dB(A)]
  category3: 78, // K [dB(A)]
};

/**
 * Korekční faktor pro rychlost
 * Lw = L0 + a·log10(v/v0)
 * kde a = 30 pro osobní, 30 pro nákladní
 */
const SPEED_CORRECTION_FACTOR = 30;

/**
 * Vypočítá emisní hladinu pro danou kategorii a rychlost
 */
function getEmissionLevel(category: 'category1' | 'category2' | 'category3', speed: number): number {
  const L0 = EMISSION_LEVELS[category];
  const v0 = 50; // referenční rychlost
  return L0 + SPEED_CORRECTION_FACTOR * Math.log10(speed / v0);
}

/**
 * Vypočítá hladinu hluku LAeq,T
 *
 * Vzorec: LAeq,T = 10·log10[Σ Ni · 10^(Lwi/10)] - 10·log10(d) - 8 + K
 *
 * kde:
 * - Ni = počet vozidel kategorie i za čas T
 * - Lwi = hladina akustického výkonu vozidla kategorie i [dB(A)]
 * - d = vzdálenost [m]
 * - -8 = korekce pro bodový zdroj → liniový
 * - K = další korekce (zatím 0)
 */
export function calculateNoise(input: NoiseCalculationInput): NoiseCalculationResult {
  const distance = input.distance ?? 7.5;

  // Vypočítej emisní hladiny pro danou rychlost
  const Lw1 = getEmissionLevel('category1', input.speed);
  const Lw2 = getEmissionLevel('category2', input.speed);
  const Lw3 = getEmissionLevel('category3', input.speed);

  // Vypočítej příspěvky jednotlivých kategorií
  const contribution1 = input.category1 * Math.pow(10, Lw1 / 10);
  const contribution2 = input.category2 * Math.pow(10, Lw2 / 10);
  const contribution3 = input.category3 * Math.pow(10, Lw3 / 10);

  // Celkový součet
  const totalContribution = contribution1 + contribution2 + contribution3;

  // Korekce vzdálenosti
  const distanceCorrection = 10 * Math.log10(distance);

  // Korekce liniový zdroj
  const lineSourceCorrection = 8;

  // Výsledná hladina
  const LAeq = 10 * Math.log10(totalContribution) - distanceCorrection - lineSourceCorrection;

  return {
    LAeq: Math.round(LAeq * 10) / 10, // zaokrouhlení na 1 desetinné místo
    contributions: {
      category1: contribution1,
      category2: contribution2,
      category3: contribution3,
    },
  };
}

/**
 * Vypočítá rozdíl hluku mezi RPDI a sčítáním
 */
export function calculateNoiseDifference(
  counting: NoiseCalculationInput,
  rpdi: NoiseCalculationInput
): number {
  const countingResult = calculateNoise(counting);
  const rpdiResult = calculateNoise(rpdi);

  return Math.round((rpdiResult.LAeq - countingResult.LAeq) * 10) / 10;
}
