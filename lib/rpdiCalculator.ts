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
      total: {
        measuredDaily: number;      // Naměřená denní intenzita (Im) - celkem 24h
        weeklyAverage: number;      // Týdenní průměr (It)
        RPDI: number;               // Roční průměrná denní intenzita
        usedCoefficients: {
          hourToDay: number;        // km,d (pokud měření není 24h)
          dayToWeek: number;        // kd,t
          weekToYear: number;       // kt,RPDI
        };
      };
      day: {
        measuredDaily: number;      // Naměřená denní intenzita (6:00-22:00)
        weeklyAverage: number;      // Týdenní průměr
        RPDI: number;               // Roční průměrná denní intenzita
        usedCoefficients: {
          hourToDay: number;
          dayToWeek: number;
          weekToYear: number;
        };
      };
      night: {
        measuredDaily: number;      // Naměřená denní intenzita (22:00-6:00)
        weeklyAverage: number;      // Týdenní průměr
        RPDI: number;               // Roční průměrná denní intenzita
        usedCoefficients: {
          hourToDay: number;
          dayToWeek: number;
          weekToYear: number;
        };
      };
    };
  };

  // Celkové hodnoty
  total: {
    total: {
      measuredDaily: number;
      weeklyAverage: number;
      RPDI: number;
    };
    day: {
      measuredDaily: number;
      weeklyAverage: number;
      RPDI: number;
    };
    night: {
      measuredDaily: number;
      weeklyAverage: number;
      RPDI: number;
    };
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
  if (TP189_VEHICLE_MAPPING.O.includes(vehicleType)) return 'O'; // Osobní (OA + LN)
  if (TP189_VEHICLE_MAPPING.M.includes(vehicleType)) return 'M'; // Motocykly
  if (TP189_VEHICLE_MAPPING.N.includes(vehicleType)) return 'N'; // Nákladní
  if (TP189_VEHICLE_MAPPING.A.includes(vehicleType)) return 'A'; // Autobusy
  if (TP189_VEHICLE_MAPPING.K.includes(vehicleType)) return 'K'; // Nákladní soupravy

  // Fallback - nemělo by nastat
  return 'O';
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

    // Koeficienty (stejné pro den i noc)
    const k_m_d = 1.0;
    const weeklyShare = WEEKLY_VARIATION[roadType][season][tp189Category][dayOfWeek];
    const k_d_t = 100 / weeklyShare;
    const monthlyShare = YEARLY_VARIATION[roadType][tp189Category][month - 1];
    const k_t_RPDI = 100 / monthlyShare;

    // CELKEM 24h
    const measuredDailyTotal = counts.reduce((sum, count) => sum + count, 0);
    const weeklyAverageTotal = measuredDailyTotal * k_m_d * k_d_t;
    const rpdiTotal = weeklyAverageTotal * k_t_RPDI;

    // DEN (6:00-22:00) - hodiny 6-21
    const measuredDailyDay = counts.slice(6, 22).reduce((sum, count) => sum + count, 0);
    const weeklyAverageDay = measuredDailyDay * k_m_d * k_d_t;
    const rpdiDay = weeklyAverageDay * k_t_RPDI;

    // NOC (22:00-6:00) - hodiny 22-23 a 0-5
    const measuredDailyNight = [...counts.slice(22, 24), ...counts.slice(0, 6)].reduce((sum, count) => sum + count, 0);
    const weeklyAverageNight = measuredDailyNight * k_m_d * k_d_t;
    const rpdiNight = weeklyAverageNight * k_t_RPDI;

    categories[vehicleType] = {
      total: {
        measuredDaily: measuredDailyTotal,
        weeklyAverage: weeklyAverageTotal,
        RPDI: Math.round(rpdiTotal),
        usedCoefficients: {
          hourToDay: k_m_d,
          dayToWeek: k_d_t,
          weekToYear: k_t_RPDI,
        },
      },
      day: {
        measuredDaily: measuredDailyDay,
        weeklyAverage: weeklyAverageDay,
        RPDI: Math.round(rpdiDay),
        usedCoefficients: {
          hourToDay: k_m_d,
          dayToWeek: k_d_t,
          weekToYear: k_t_RPDI,
        },
      },
      night: {
        measuredDaily: measuredDailyNight,
        weeklyAverage: weeklyAverageNight,
        RPDI: Math.round(rpdiNight),
        usedCoefficients: {
          hourToDay: k_m_d,
          dayToWeek: k_d_t,
          weekToYear: k_t_RPDI,
        },
      },
    };
  }

  // Celkové hodnoty (součet všech kategorií)
  const total = {
    total: {
      measuredDaily: Object.values(categories).reduce((sum, cat) => sum + cat.total.measuredDaily, 0),
      weeklyAverage: Object.values(categories).reduce((sum, cat) => sum + cat.total.weeklyAverage, 0),
      RPDI: Object.values(categories).reduce((sum, cat) => sum + cat.total.RPDI, 0),
    },
    day: {
      measuredDaily: Object.values(categories).reduce((sum, cat) => sum + cat.day.measuredDaily, 0),
      weeklyAverage: Object.values(categories).reduce((sum, cat) => sum + cat.day.weeklyAverage, 0),
      RPDI: Object.values(categories).reduce((sum, cat) => sum + cat.day.RPDI, 0),
    },
    night: {
      measuredDaily: Object.values(categories).reduce((sum, cat) => sum + cat.night.measuredDaily, 0),
      weeklyAverage: Object.values(categories).reduce((sum, cat) => sum + cat.night.weeklyAverage, 0),
      RPDI: Object.values(categories).reduce((sum, cat) => sum + cat.night.RPDI, 0),
    },
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
    output += `  CELKEM 24h - RPDI: ${cat.total.RPDI} voz/den (naměřeno: ${cat.total.measuredDaily})\n`;
    output += `  DEN - RPDI: ${cat.day.RPDI} voz/den (naměřeno: ${cat.day.measuredDaily})\n`;
    output += `  NOC - RPDI: ${cat.night.RPDI} voz/den (naměřeno: ${cat.night.measuredDaily})\n`;
    output += `  Koeficienty: kd,t=${cat.total.usedCoefficients.dayToWeek.toFixed(3)}, kt,RPDI=${cat.total.usedCoefficients.weekToYear.toFixed(3)}\n\n`;
  }

  output += `--- CELKEM ---\n`;
  output += `CELKEM 24h - RPDI: ${result.total.total.RPDI} voz/den (naměřeno: ${result.total.total.measuredDaily})\n`;
  output += `DEN - RPDI: ${result.total.day.RPDI} voz/den (naměřeno: ${result.total.day.measuredDaily})\n`;
  output += `NOC - RPDI: ${result.total.night.RPDI} voz/den (naměřeno: ${result.total.night.measuredDaily})\n`;

  return output;
}
