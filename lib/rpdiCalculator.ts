// RPDI Calculator podle TP 189
// Výpočet ročního průměrného denního počtu vozidel (RPDI)

import {
  RoadType,
  VehicleType,
  Season,
  DayOfWeek,
  DAILY_VARIATION,
  WEEKLY_VARIATION,
  YEARLY_VARIATION,
  getSeasonFromMonth,
  getDayOfWeekKey,
  TP189_VEHICLE_MAPPING,
} from './tp189coefficients';

export interface RPDIInput {
  // Parametry měření
  countingDate: Date; // Datum sčítání
  roadType: RoadType; // Typ komunikace

  // Naměřené hodnoty za 24 hodin (index 0 = 00:00-00:59, index 23 = 23:00-23:59)
  hourlyCounts: {
    OA: number[]; // Osobní automobily (24 hodnot)
    LN: number[]; // Lehká užitková (24 hodnot)
    N: number[];  // Nákladní (24 hodnot)
    A: number[];  // Autobusy (24 hodnot)
    M: number[];  // Motocykly (24 hodnot)
    K: number[];  // Kola/koloběžky (24 hodnot)
  };
}

export interface RPDIResult {
  // Výsledky pro každou kategorii vozidel
  categories: {
    [key in VehicleType]: {
      measuredDaily: number;      // Naměřená denní intenzita (Im)
      weeklyAverage: number;      // Týdenní průměr (It)
      RPDI: number;               // Roční průměrná denní intenzita
      usedCoefficients: {
        hourToDay: number;        // km,d (pokud měření není 24h)
        dayToWeek: number;        // kd,t
        weekToYear: number;       // kt,RPDI
      };
    };
  };

  // Celkové hodnoty
  total: {
    measuredDaily: number;
    weeklyAverage: number;
    RPDI: number;
  };

  // Metadata
  metadata: {
    countingDate: Date;
    dayOfWeek: string;
    season: string;
    roadType: string;
  };
}

/**
 * Mapuje naši kategorii vozidla na kategorii TP 189
 */
function getTP189Category(vehicleType: VehicleType): string {
  if (TP189_VEHICLE_MAPPING.category1.includes(vehicleType)) return 'category1';
  if (TP189_VEHICLE_MAPPING.category2.includes(vehicleType)) return 'category2';
  if (TP189_VEHICLE_MAPPING.category3.includes(vehicleType)) return 'category3';

  // Fallback pro kola (K) - použijeme category3
  return 'category3';
}

/**
 * Vypočítá RPDI podle TP 189
 *
 * Vzorec: RPDI = Im × km,d × kd,t × kt,RPDI
 * kde:
 *   Im = naměřená intenzita (denní součet)
 *   km,d = koeficient z měřené doby na denní intenzitu (pokud měření není 24h)
 *   kd,t = koeficient z denní intenzity na týdenní průměr
 *   kt,RPDI = koeficient z týdenního průměru na roční průměr
 */
export function calculateRPDI(input: RPDIInput): RPDIResult {
  const { countingDate, roadType, hourlyCounts } = input;

  // Určení parametrů měření
  const month = countingDate.getMonth() + 1; // 1-12
  const dayOfWeekIndex = countingDate.getDay(); // 0=neděle, 6=sobota
  const season = getSeasonFromMonth(month);
  const dayOfWeek = getDayOfWeekKey(dayOfWeekIndex);

  // Výsledky pro jednotlivé kategorie
  const categories: RPDIResult['categories'] = {} as any;

  // Výpočet pro každou kategorii vozidel
  const vehicleTypes: VehicleType[] = ['OA', 'LN', 'N', 'A', 'M', 'K'];

  for (const vehicleType of vehicleTypes) {
    const tp189Category = getTP189Category(vehicleType);
    const counts = hourlyCounts[vehicleType];

    // 1. Naměřená denní intenzita (Im) - součet všech 24 hodin
    const measuredDaily = counts.reduce((sum, count) => sum + count, 0);

    // 2. Koeficient km,d (hodina -> den)
    // Pokud měříme celých 24 hodin, tento koeficient nepoužíváme (= 1.0)
    // V našem případě máme vždy 24 hodin, takže km,d = 1.0
    const k_m_d = 1.0;

    // 3. Koeficient kd,t (den -> týdenní průměr)
    // kd,t = 1 / (podíl dne v týdnu / 100)
    // Podíl získáme z WEEKLY_VARIATION
    const weeklyShare = WEEKLY_VARIATION[roadType][season][tp189Category][dayOfWeek];
    const k_d_t = 100 / weeklyShare;

    // 4. Týdenní průměr (It)
    const weeklyAverage = measuredDaily * k_m_d * k_d_t;

    // 5. Koeficient kt,RPDI (týdenní průměr -> roční průměr)
    // kt,RPDI = 1 / (podíl měsíce / 100)
    const monthlyShare = YEARLY_VARIATION[roadType][tp189Category][month - 1];
    const k_t_RPDI = 100 / monthlyShare;

    // 6. RPDI
    const RPDI = weeklyAverage * k_t_RPDI;

    categories[vehicleType] = {
      measuredDaily,
      weeklyAverage,
      RPDI: Math.round(RPDI),
      usedCoefficients: {
        hourToDay: k_m_d,
        dayToWeek: k_d_t,
        weekToYear: k_t_RPDI,
      },
    };
  }

  // Celkové hodnoty (součet všech kategorií)
  const total = {
    measuredDaily: Object.values(categories).reduce((sum, cat) => sum + cat.measuredDaily, 0),
    weeklyAverage: Object.values(categories).reduce((sum, cat) => sum + cat.weeklyAverage, 0),
    RPDI: Object.values(categories).reduce((sum, cat) => sum + cat.RPDI, 0),
  };

  return {
    categories,
    total,
    metadata: {
      countingDate,
      dayOfWeek: ['neděle', 'pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota'][dayOfWeekIndex],
      season: { jarni: 'jarní', prazdninove: 'prázdninové', podzimni: 'podzimní', zimni: 'zimní' }[season],
      roadType,
    },
  };
}

/**
 * Pomocná funkce pro validaci vstupních dat
 */
export function validateRPDIInput(input: RPDIInput): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Kontrola, zda máme 24 hodnot pro každou kategorii
  const vehicleTypes: VehicleType[] = ['OA', 'LN', 'N', 'A', 'M', 'K'];
  for (const vehicleType of vehicleTypes) {
    const counts = input.hourlyCounts[vehicleType];
    if (!counts || counts.length !== 24) {
      errors.push(`Kategorie ${vehicleType} musí mít 24 hodinových hodnot (má ${counts?.length || 0})`);
    }

    // Kontrola, zda jsou všechny hodnoty >= 0
    if (counts && counts.some(c => c < 0 || !Number.isFinite(c))) {
      errors.push(`Kategorie ${vehicleType} obsahuje neplatné hodnoty`);
    }
  }

  // Kontrola data
  if (!(input.countingDate instanceof Date) || isNaN(input.countingDate.getTime())) {
    errors.push('Neplatné datum sčítání');
  }

  // Kontrola typu komunikace
  const validRoadTypes: RoadType[] = ['D-I', 'D-II', 'E', 'I', 'II-H', 'II-S', 'II-R-L', 'II-R-Z', 'M'];
  if (!validRoadTypes.includes(input.roadType)) {
    errors.push(`Neplatný typ komunikace: ${input.roadType}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Pomocná funkce pro formátování výsledků
 */
export function formatRPDIResult(result: RPDIResult): string {
  let output = '';

  output += `=== VÝSLEDKY VÝPOČTU RPDI ===\n\n`;
  output += `Datum měření: ${result.metadata.countingDate.toLocaleDateString('cs-CZ')}\n`;
  output += `Den v týdnu: ${result.metadata.dayOfWeek}\n`;
  output += `Období: ${result.metadata.season}\n`;
  output += `Typ komunikace: ${result.metadata.roadType}\n\n`;

  output += `--- Výsledky podle kategorií ---\n\n`;

  const vehicleTypes: VehicleType[] = ['OA', 'LN', 'N', 'A', 'M', 'K'];
  const vehicleNames = {
    OA: 'Osobní automobily',
    LN: 'Lehká užitková',
    N: 'Nákladní',
    A: 'Autobusy',
    M: 'Motocykly',
    K: 'Kola/koloběžky',
  };

  for (const vehicleType of vehicleTypes) {
    const cat = result.categories[vehicleType];
    output += `${vehicleNames[vehicleType]} (${vehicleType}):\n`;
    output += `  Naměřená denní intenzita: ${cat.measuredDaily} voz/den\n`;
    output += `  Týdenní průměr: ${Math.round(cat.weeklyAverage)} voz/den\n`;
    output += `  RPDI: ${cat.RPDI} voz/den\n`;
    output += `  Koeficienty: kd,t=${cat.usedCoefficients.dayToWeek.toFixed(3)}, kt,RPDI=${cat.usedCoefficients.weekToYear.toFixed(3)}\n\n`;
  }

  output += `--- CELKEM ---\n`;
  output += `Naměřená denní intenzita: ${result.total.measuredDaily} voz/den\n`;
  output += `Týdenní průměr: ${Math.round(result.total.weeklyAverage)} voz/den\n`;
  output += `RPDI: ${result.total.RPDI} voz/den\n`;

  return output;
}
