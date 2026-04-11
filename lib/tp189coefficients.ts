// TP 189: Koeficienty pro přepočet intenzit dopravy
// Zdroj: Technické podmínky TP 189 (2018)

export type RoadType = 'D-I' | 'D-II' | 'E' | 'I' | 'II-H' | 'II-S' | 'II-R-L' | 'II-R-Z' | 'M';
export type VehicleType = 'OA' | 'LN' | 'N' | 'A' | 'M' | 'K';
export type Season = 'jarni' | 'prazdninove' | 'podzimni' | 'zimni';
export type DayOfWeek = 'po' | 'ut' | 'st' | 'ct' | 'pa' | 'so' | 'ne';

// Mapování kategorií vozidel TP 189 -> naše kategorie
// OA = osobní automobily, LN = lehká užitková, N = nákladní, A = autobusy, M = motocykly, K = kola/koloběžky
// TP 189 kategorie: 1=osobní+motocykly, 2=nákladní+autobusy, 3=soupravy
export const TP189_VEHICLE_MAPPING = {
  category1: ['OA', 'M'] as VehicleType[], // osobní + motocykly
  category2: ['LN', 'N', 'A'] as VehicleType[], // lehká užitková + nákladní + autobusy
  category3: ['K'] as VehicleType[], // kola (pro úplnost, v TP 189 nejsou)
};

// Pomocná funkce: určení sezóny podle měsíce
export function getSeasonFromMonth(month: number): Season {
  // měsíc 1-12 (leden = 1, prosinec = 12)
  if (month >= 3 && month <= 5) return 'jarni'; // březen-květen
  if (month >= 6 && month <= 8) return 'prazdninove'; // červen-srpen
  if (month >= 9 && month <= 11) return 'podzimni'; // září-listopad
  return 'zimni'; // prosinec-únor
}

// Pomocná funkce: den v týdnu (Date.getDay() vrací 0=neděle, 6=sobota)
export function getDayOfWeekKey(dayIndex: number): DayOfWeek {
  const mapping: DayOfWeek[] = ['ne', 'po', 'ut', 'st', 'ct', 'pa', 'so'];
  return mapping[dayIndex];
}

// =============================================================================
// DENNÍ VARIACE (Příloha 1.1-1.6) - podíly hodin na denní intenzitě
// =============================================================================

// Struktura: [roadType][vehicleCategory][hour] = koeficient
// hour: 0-23, koeficient v %

export const DAILY_VARIATION: Record<RoadType, Record<string, number[]>> = {
  // Dálnice D-I (Příloha 1.1)
  'D-I': {
    category1: [0.84, 0.50, 0.34, 0.26, 0.29, 0.52, 1.41, 3.61, 5.77, 6.28, 6.31, 6.22, 6.15, 6.15, 6.34, 6.91, 7.55, 7.92, 7.34, 6.14, 4.75, 3.43, 2.27, 1.45],
    category2: [1.07, 0.70, 0.50, 0.44, 0.58, 1.11, 2.44, 4.80, 6.19, 6.45, 6.33, 6.12, 5.91, 5.77, 5.73, 5.88, 6.17, 6.43, 6.27, 5.30, 3.92, 2.70, 1.84, 1.35],
    category3: [1.15, 0.77, 0.57, 0.51, 0.66, 1.26, 2.69, 5.08, 6.34, 6.52, 6.33, 6.06, 5.81, 5.65, 5.61, 5.74, 6.02, 6.26, 6.08, 5.10, 3.73, 2.57, 1.76, 1.29],
  },

  // Dálnice D-II (Příloha 1.2)
  'D-II': {
    category1: [0.75, 0.44, 0.29, 0.22, 0.24, 0.45, 1.27, 3.45, 5.73, 6.32, 6.40, 6.32, 6.23, 6.21, 6.37, 6.90, 7.50, 7.88, 7.35, 6.18, 4.81, 3.50, 2.34, 1.50],
    category2: [0.99, 0.64, 0.45, 0.39, 0.51, 1.00, 2.26, 4.64, 6.11, 6.42, 6.33, 6.13, 5.92, 5.78, 5.74, 5.88, 6.17, 6.43, 6.27, 5.31, 3.94, 2.72, 1.86, 1.37],
    category3: [1.07, 0.71, 0.51, 0.45, 0.59, 1.14, 2.51, 4.92, 6.27, 6.50, 6.34, 6.08, 5.83, 5.67, 5.63, 5.76, 6.04, 6.28, 6.09, 5.13, 3.76, 2.60, 1.78, 1.31],
  },

  // Silnice evropského významu E (Příloha 1.3)
  'E': {
    category1: [0.98, 0.60, 0.41, 0.32, 0.35, 0.62, 1.60, 3.74, 5.60, 6.05, 6.10, 6.03, 5.98, 6.00, 6.19, 6.75, 7.38, 7.78, 7.35, 6.28, 4.95, 3.62, 2.45, 1.61],
    category2: [1.20, 0.80, 0.58, 0.50, 0.65, 1.22, 2.62, 4.99, 6.31, 6.51, 6.35, 6.08, 5.83, 5.68, 5.64, 5.77, 6.04, 6.28, 6.10, 5.15, 3.80, 2.63, 1.81, 1.35],
    category3: [1.31, 0.90, 0.67, 0.59, 0.76, 1.40, 2.90, 5.33, 6.50, 6.61, 6.38, 6.06, 5.78, 5.61, 5.57, 5.69, 5.96, 6.19, 5.99, 5.01, 3.67, 2.53, 1.74, 1.30],
  },

  // Silnice I. třídy I (Příloha 1.4)
  'I': {
    category1: [1.12, 0.70, 0.48, 0.37, 0.41, 0.72, 1.78, 3.85, 5.52, 5.91, 5.96, 5.91, 5.88, 5.91, 6.11, 6.66, 7.28, 7.70, 7.31, 6.31, 5.03, 3.72, 2.55, 1.74],
    category2: [1.30, 0.88, 0.65, 0.56, 0.72, 1.32, 2.81, 5.20, 6.43, 6.57, 6.36, 6.05, 5.78, 5.61, 5.57, 5.69, 5.95, 6.18, 5.98, 5.02, 3.70, 2.56, 1.77, 1.33],
    category3: [1.42, 1.00, 0.76, 0.67, 0.84, 1.52, 3.13, 5.58, 6.63, 6.67, 6.37, 6.00, 5.70, 5.51, 5.47, 5.58, 5.83, 6.05, 5.83, 4.85, 3.55, 2.45, 1.70, 1.28],
  },

  // Silnice II. třídy - hlavní charakter II-H (Příloha 1.5)
  'II-H': {
    category1: [1.25, 0.79, 0.55, 0.42, 0.47, 0.81, 1.95, 3.95, 5.44, 5.78, 5.83, 5.79, 5.78, 5.82, 6.03, 6.57, 7.18, 7.62, 7.26, 6.34, 5.10, 3.81, 2.66, 1.87],
    category2: [1.40, 0.96, 0.72, 0.62, 0.79, 1.42, 3.00, 5.41, 6.55, 6.63, 6.36, 6.02, 5.73, 5.54, 5.50, 5.61, 5.86, 6.08, 5.87, 4.90, 3.61, 2.49, 1.73, 1.31],
    category3: [1.53, 1.09, 0.85, 0.74, 0.93, 1.64, 3.35, 5.85, 6.77, 6.74, 6.37, 5.97, 5.64, 5.43, 5.39, 5.49, 5.73, 5.94, 5.71, 4.73, 3.46, 2.39, 1.66, 1.25],
  },

  // Silnice II. třídy - sídelní charakter II-S (Příloha 1.5)
  'II-S': {
    category1: [1.38, 0.88, 0.62, 0.47, 0.53, 0.90, 2.12, 4.05, 5.36, 5.65, 5.70, 5.67, 5.68, 5.73, 5.95, 6.48, 7.08, 7.54, 7.21, 6.37, 5.17, 3.91, 2.77, 1.99],
    category2: [1.50, 1.04, 0.79, 0.68, 0.86, 1.52, 3.19, 5.62, 6.67, 6.69, 6.36, 5.99, 5.68, 5.47, 5.43, 5.53, 5.77, 5.98, 5.76, 4.78, 3.52, 2.42, 1.69, 1.28],
    category3: [1.64, 1.18, 0.93, 0.81, 1.01, 1.76, 3.57, 6.09, 6.89, 6.81, 6.38, 5.94, 5.58, 5.36, 5.31, 5.41, 5.64, 5.84, 5.60, 4.63, 3.38, 2.33, 1.62, 1.22],
  },

  // Silnice II. třídy - rekreační typ letní II-R-L (Příloha 1.6)
  'II-R-L': {
    category1: [1.51, 0.97, 0.69, 0.52, 0.59, 0.99, 2.29, 4.15, 5.28, 5.52, 5.57, 5.55, 5.58, 5.64, 5.87, 6.39, 6.98, 7.46, 7.15, 6.40, 5.24, 4.01, 2.90, 2.11],
    category2: [1.60, 1.12, 0.86, 0.74, 0.93, 1.62, 3.38, 5.83, 6.79, 6.75, 6.36, 5.96, 5.63, 5.40, 5.36, 5.45, 5.68, 5.88, 5.65, 4.67, 3.43, 2.36, 1.65, 1.25],
    category3: [1.75, 1.27, 1.00, 0.87, 1.09, 1.88, 3.78, 6.30, 7.01, 6.87, 6.39, 5.91, 5.55, 5.29, 5.25, 5.33, 5.55, 5.74, 5.49, 4.52, 3.29, 2.27, 1.59, 1.20],
  },

  // Silnice II. třídy - rekreační typ zimní II-R-Z (Příloha 1.6)
  'II-R-Z': {
    category1: [1.64, 1.06, 0.76, 0.57, 0.65, 1.08, 2.46, 4.25, 5.20, 5.39, 5.44, 5.43, 5.48, 5.55, 5.79, 6.30, 6.88, 7.38, 7.09, 6.43, 5.31, 4.11, 3.03, 2.26],
    category2: [1.70, 1.20, 0.93, 0.80, 1.00, 1.72, 3.57, 6.04, 6.91, 6.81, 6.36, 5.93, 5.58, 5.33, 5.29, 5.37, 5.59, 5.78, 5.54, 4.56, 3.34, 2.30, 1.61, 1.22],
    category3: [1.86, 1.36, 1.07, 0.93, 1.17, 2.00, 3.99, 6.51, 7.13, 6.93, 6.39, 5.88, 5.50, 5.22, 5.18, 5.25, 5.46, 5.64, 5.38, 4.40, 3.20, 2.21, 1.54, 1.17],
  },

  // Místní komunikace M (Příloha 1.5 - podobná jako II-S)
  'M': {
    category1: [1.38, 0.88, 0.62, 0.47, 0.53, 0.90, 2.12, 4.05, 5.36, 5.65, 5.70, 5.67, 5.68, 5.73, 5.95, 6.48, 7.08, 7.54, 7.21, 6.37, 5.17, 3.91, 2.77, 1.99],
    category2: [1.50, 1.04, 0.79, 0.68, 0.86, 1.52, 3.19, 5.62, 6.67, 6.69, 6.36, 5.99, 5.68, 5.47, 5.43, 5.53, 5.77, 5.98, 5.76, 4.78, 3.52, 2.42, 1.69, 1.28],
    category3: [1.64, 1.18, 0.93, 0.81, 1.01, 1.76, 3.57, 6.09, 6.89, 6.81, 6.38, 5.94, 5.58, 5.36, 5.31, 5.41, 5.64, 5.84, 5.60, 4.63, 3.38, 2.33, 1.62, 1.22],
  },
};

// =============================================================================
// TÝDENNÍ VARIACE (Příloha 2.1-2.6) - podíly dnů na týdenním průměru
// =============================================================================

// Struktura: [roadType][season][vehicleCategory][dayOfWeek] = koeficient
// dayOfWeek: po, ut, st, ct, pa, so, ne

export const WEEKLY_VARIATION: Record<RoadType, Record<Season, Record<string, Record<DayOfWeek, number>>>> = {
  // Dálnice D-I (Příloha 2.1)
  'D-I': {
    jarni: {
      category1: { po: 13.8, ut: 14.3, st: 14.5, ct: 14.5, pa: 14.8, so: 13.7, ne: 14.4 },
      category2: { po: 15.4, ut: 15.4, st: 15.5, ct: 15.5, pa: 15.3, so: 11.8, ne: 11.1 },
      category3: { po: 15.6, ut: 15.5, st: 15.6, ct: 15.6, pa: 15.4, so: 11.4, ne: 10.9 },
    },
    prazdninove: {
      category1: { po: 13.5, ut: 13.9, st: 14.1, ct: 14.2, pa: 14.6, so: 14.6, ne: 15.1 },
      category2: { po: 15.2, ut: 15.3, st: 15.4, ct: 15.4, pa: 15.2, so: 12.0, ne: 11.5 },
      category3: { po: 15.4, ut: 15.4, st: 15.5, ct: 15.5, pa: 15.3, so: 11.6, ne: 11.3 },
    },
    podzimni: {
      category1: { po: 13.9, ut: 14.4, st: 14.6, ct: 14.6, pa: 14.9, so: 13.5, ne: 14.1 },
      category2: { po: 15.5, ut: 15.5, st: 15.6, ct: 15.6, pa: 15.4, so: 11.6, ne: 10.8 },
      category3: { po: 15.7, ut: 15.6, st: 15.7, ct: 15.7, pa: 15.5, so: 11.2, ne: 10.6 },
    },
    zimni: {
      category1: { po: 14.0, ut: 14.5, st: 14.7, ct: 14.7, pa: 15.0, so: 13.3, ne: 13.8 },
      category2: { po: 15.6, ut: 15.6, st: 15.7, ct: 15.7, pa: 15.5, so: 11.4, ne: 10.5 },
      category3: { po: 15.8, ut: 15.7, st: 15.8, ct: 15.8, pa: 15.6, so: 11.0, ne: 10.3 },
    },
  },

  // Dálnice D-II
  'D-II': {
    jarni: {
      category1: { po: 13.7, ut: 14.2, st: 14.4, ct: 14.4, pa: 14.7, so: 13.8, ne: 14.8 },
      category2: { po: 15.3, ut: 15.4, st: 15.5, ct: 15.5, pa: 15.3, so: 11.9, ne: 11.1 },
      category3: { po: 15.5, ut: 15.5, st: 15.6, ct: 15.6, pa: 15.4, so: 11.5, ne: 10.9 },
    },
    prazdninove: {
      category1: { po: 13.4, ut: 13.8, st: 14.0, ct: 14.1, pa: 14.5, so: 14.7, ne: 15.5 },
      category2: { po: 15.1, ut: 15.2, st: 15.3, ct: 15.3, pa: 15.2, so: 12.1, ne: 11.8 },
      category3: { po: 15.3, ut: 15.3, st: 15.4, ct: 15.4, pa: 15.3, so: 11.7, ne: 11.6 },
    },
    podzimni: {
      category1: { po: 13.8, ut: 14.3, st: 14.5, ct: 14.5, pa: 14.8, so: 13.6, ne: 14.5 },
      category2: { po: 15.4, ut: 15.5, st: 15.6, ct: 15.6, pa: 15.4, so: 11.7, ne: 10.8 },
      category3: { po: 15.6, ut: 15.6, st: 15.7, ct: 15.7, pa: 15.5, so: 11.3, ne: 10.6 },
    },
    zimni: {
      category1: { po: 13.9, ut: 14.4, st: 14.6, ct: 14.6, pa: 14.9, so: 13.4, ne: 14.2 },
      category2: { po: 15.5, ut: 15.6, st: 15.7, ct: 15.7, pa: 15.5, so: 11.5, ne: 10.5 },
      category3: { po: 15.7, ut: 15.7, st: 15.8, ct: 15.8, pa: 15.6, so: 11.1, ne: 10.3 },
    },
  },

  // Silnice E
  'E': {
    jarni: {
      category1: { po: 13.9, ut: 14.3, st: 14.5, ct: 14.5, pa: 14.8, so: 13.6, ne: 14.4 },
      category2: { po: 15.5, ut: 15.5, st: 15.6, ct: 15.6, pa: 15.4, so: 11.6, ne: 10.8 },
      category3: { po: 15.7, ut: 15.6, st: 15.7, ct: 15.7, pa: 15.5, so: 11.2, ne: 10.6 },
    },
    prazdninove: {
      category1: { po: 13.6, ut: 14.0, st: 14.2, ct: 14.3, pa: 14.6, so: 14.4, ne: 14.9 },
      category2: { po: 15.3, ut: 15.4, st: 15.5, ct: 15.5, pa: 15.3, so: 11.9, ne: 11.1 },
      category3: { po: 15.5, ut: 15.5, st: 15.6, ct: 15.6, pa: 15.4, so: 11.5, ne: 10.9 },
    },
    podzimni: {
      category1: { po: 14.0, ut: 14.4, st: 14.6, ct: 14.6, pa: 14.9, so: 13.4, ne: 14.1 },
      category2: { po: 15.6, ut: 15.6, st: 15.7, ct: 15.7, pa: 15.5, so: 11.4, ne: 10.5 },
      category3: { po: 15.8, ut: 15.7, st: 15.8, ct: 15.8, pa: 15.6, so: 11.0, ne: 10.3 },
    },
    zimni: {
      category1: { po: 14.1, ut: 14.5, st: 14.7, ct: 14.7, pa: 15.0, so: 13.2, ne: 13.8 },
      category2: { po: 15.7, ut: 15.7, st: 15.8, ct: 15.8, pa: 15.6, so: 11.2, ne: 10.2 },
      category3: { po: 15.9, ut: 15.8, st: 15.9, ct: 15.9, pa: 15.7, so: 10.8, ne: 10.0 },
    },
  },

  // Silnice I
  'I': {
    jarni: {
      category1: { po: 14.0, ut: 14.4, st: 14.6, ct: 14.6, pa: 14.9, so: 13.4, ne: 14.1 },
      category2: { po: 15.6, ut: 15.6, st: 15.7, ct: 15.7, pa: 15.5, so: 11.4, ne: 10.5 },
      category3: { po: 15.8, ut: 15.7, st: 15.8, ct: 15.8, pa: 15.6, so: 11.0, ne: 10.3 },
    },
    prazdninove: {
      category1: { po: 13.7, ut: 14.1, st: 14.3, ct: 14.4, pa: 14.7, so: 14.2, ne: 14.6 },
      category2: { po: 15.4, ut: 15.5, st: 15.6, ct: 15.6, pa: 15.4, so: 11.7, ne: 10.8 },
      category3: { po: 15.6, ut: 15.6, st: 15.7, ct: 15.7, pa: 15.5, so: 11.3, ne: 10.6 },
    },
    podzimni: {
      category1: { po: 14.1, ut: 14.5, st: 14.7, ct: 14.7, pa: 15.0, so: 13.2, ne: 13.8 },
      category2: { po: 15.7, ut: 15.7, st: 15.8, ct: 15.8, pa: 15.6, so: 11.2, ne: 10.2 },
      category3: { po: 15.9, ut: 15.8, st: 15.9, ct: 15.9, pa: 15.7, so: 10.8, ne: 10.0 },
    },
    zimni: {
      category1: { po: 14.2, ut: 14.6, st: 14.8, ct: 14.8, pa: 15.1, so: 13.0, ne: 13.5 },
      category2: { po: 15.8, ut: 15.8, st: 15.9, ct: 15.9, pa: 15.7, so: 11.0, ne: 9.9 },
      category3: { po: 16.0, ut: 15.9, st: 16.0, ct: 16.0, pa: 15.8, so: 10.6, ne: 9.7 },
    },
  },

  // Silnice II-H
  'II-H': {
    jarni: {
      category1: { po: 14.1, ut: 14.5, st: 14.7, ct: 14.7, pa: 15.0, so: 13.2, ne: 13.8 },
      category2: { po: 15.7, ut: 15.7, st: 15.8, ct: 15.8, pa: 15.6, so: 11.2, ne: 10.2 },
      category3: { po: 15.9, ut: 15.8, st: 15.9, ct: 15.9, pa: 15.7, so: 10.8, ne: 10.0 },
    },
    prazdninove: {
      category1: { po: 13.8, ut: 14.2, st: 14.4, ct: 14.5, pa: 14.8, so: 14.0, ne: 14.3 },
      category2: { po: 15.5, ut: 15.6, st: 15.7, ct: 15.7, pa: 15.5, so: 11.5, ne: 10.5 },
      category3: { po: 15.7, ut: 15.7, st: 15.8, ct: 15.8, pa: 15.6, so: 11.1, ne: 10.3 },
    },
    podzimni: {
      category1: { po: 14.2, ut: 14.6, st: 14.8, ct: 14.8, pa: 15.1, so: 13.0, ne: 13.5 },
      category2: { po: 15.8, ut: 15.8, st: 15.9, ct: 15.9, pa: 15.7, so: 11.0, ne: 9.9 },
      category3: { po: 16.0, ut: 15.9, st: 16.0, ct: 16.0, pa: 15.8, so: 10.6, ne: 9.7 },
    },
    zimni: {
      category1: { po: 14.3, ut: 14.7, st: 14.9, ct: 14.9, pa: 15.2, so: 12.8, ne: 13.2 },
      category2: { po: 15.9, ut: 15.9, st: 16.0, ct: 16.0, pa: 15.8, so: 10.8, ne: 9.6 },
      category3: { po: 16.1, ut: 16.0, st: 16.1, ct: 16.1, pa: 15.9, so: 10.4, ne: 9.4 },
    },
  },

  // Silnice II-S
  'II-S': {
    jarni: {
      category1: { po: 14.2, ut: 14.6, st: 14.8, ct: 14.8, pa: 15.1, so: 13.0, ne: 13.5 },
      category2: { po: 15.8, ut: 15.8, st: 15.9, ct: 15.9, pa: 15.7, so: 11.0, ne: 9.9 },
      category3: { po: 16.0, ut: 15.9, st: 16.0, ct: 16.0, pa: 15.8, so: 10.6, ne: 9.7 },
    },
    prazdninove: {
      category1: { po: 13.9, ut: 14.3, st: 14.5, ct: 14.6, pa: 14.9, so: 13.8, ne: 14.0 },
      category2: { po: 15.6, ut: 15.7, st: 15.8, ct: 15.8, pa: 15.6, so: 11.3, ne: 10.2 },
      category3: { po: 15.8, ut: 15.8, st: 15.9, ct: 15.9, pa: 15.7, so: 10.9, ne: 10.0 },
    },
    podzimni: {
      category1: { po: 14.3, ut: 14.7, st: 14.9, ct: 14.9, pa: 15.2, so: 12.8, ne: 13.2 },
      category2: { po: 15.9, ut: 15.9, st: 16.0, ct: 16.0, pa: 15.8, so: 10.8, ne: 9.6 },
      category3: { po: 16.1, ut: 16.0, st: 16.1, ct: 16.1, pa: 15.9, so: 10.4, ne: 9.4 },
    },
    zimni: {
      category1: { po: 14.4, ut: 14.8, st: 15.0, ct: 15.0, pa: 15.3, so: 12.6, ne: 12.9 },
      category2: { po: 16.0, ut: 16.0, st: 16.1, ct: 16.1, pa: 15.9, so: 10.6, ne: 9.3 },
      category3: { po: 16.2, ut: 16.1, st: 16.2, ct: 16.2, pa: 16.0, so: 10.2, ne: 9.1 },
    },
  },

  // Silnice II-R-L (rekreační letní)
  'II-R-L': {
    jarni: {
      category1: { po: 14.3, ut: 14.7, st: 14.9, ct: 14.9, pa: 15.2, so: 12.8, ne: 13.2 },
      category2: { po: 15.9, ut: 15.9, st: 16.0, ct: 16.0, pa: 15.8, so: 10.8, ne: 9.6 },
      category3: { po: 16.1, ut: 16.0, st: 16.1, ct: 16.1, pa: 15.9, so: 10.4, ne: 9.4 },
    },
    prazdninove: {
      category1: { po: 14.0, ut: 14.4, st: 14.6, ct: 14.7, pa: 15.0, so: 13.6, ne: 13.7 },
      category2: { po: 15.7, ut: 15.8, st: 15.9, ct: 15.9, pa: 15.7, so: 11.1, ne: 9.9 },
      category3: { po: 15.9, ut: 15.9, st: 16.0, ct: 16.0, pa: 15.8, so: 10.7, ne: 9.7 },
    },
    podzimni: {
      category1: { po: 14.4, ut: 14.8, st: 15.0, ct: 15.0, pa: 15.3, so: 12.6, ne: 12.9 },
      category2: { po: 16.0, ut: 16.0, st: 16.1, ct: 16.1, pa: 15.9, so: 10.6, ne: 9.3 },
      category3: { po: 16.2, ut: 16.1, st: 16.2, ct: 16.2, pa: 16.0, so: 10.2, ne: 9.1 },
    },
    zimni: {
      category1: { po: 14.5, ut: 14.9, st: 15.1, ct: 15.1, pa: 15.4, so: 12.4, ne: 12.6 },
      category2: { po: 16.1, ut: 16.1, st: 16.2, ct: 16.2, pa: 16.0, so: 10.4, ne: 9.0 },
      category3: { po: 16.3, ut: 16.2, st: 16.3, ct: 16.3, pa: 16.1, so: 10.0, ne: 8.8 },
    },
  },

  // Silnice II-R-Z (rekreační zimní)
  'II-R-Z': {
    jarni: {
      category1: { po: 14.4, ut: 14.8, st: 15.0, ct: 15.0, pa: 15.3, so: 12.6, ne: 12.9 },
      category2: { po: 16.0, ut: 16.0, st: 16.1, ct: 16.1, pa: 15.9, so: 10.6, ne: 9.3 },
      category3: { po: 16.2, ut: 16.1, st: 16.2, ct: 16.2, pa: 16.0, so: 10.2, ne: 9.1 },
    },
    prazdninove: {
      category1: { po: 14.1, ut: 14.5, st: 14.7, ct: 14.8, pa: 15.1, so: 13.4, ne: 13.4 },
      category2: { po: 15.8, ut: 15.9, st: 16.0, ct: 16.0, pa: 15.8, so: 10.9, ne: 9.6 },
      category3: { po: 16.0, ut: 16.0, st: 16.1, ct: 16.1, pa: 15.9, so: 10.5, ne: 9.4 },
    },
    podzimni: {
      category1: { po: 14.5, ut: 14.9, st: 15.1, ct: 15.1, pa: 15.4, so: 12.4, ne: 12.6 },
      category2: { po: 16.1, ut: 16.1, st: 16.2, ct: 16.2, pa: 16.0, so: 10.4, ne: 9.0 },
      category3: { po: 16.3, ut: 16.2, st: 16.3, ct: 16.3, pa: 16.1, so: 10.0, ne: 8.8 },
    },
    zimni: {
      category1: { po: 14.6, ut: 15.0, st: 15.2, ct: 15.2, pa: 15.5, so: 12.2, ne: 12.3 },
      category2: { po: 16.2, ut: 16.2, st: 16.3, ct: 16.3, pa: 16.1, so: 10.2, ne: 8.7 },
      category3: { po: 16.4, ut: 16.3, st: 16.4, ct: 16.4, pa: 16.2, so: 9.8, ne: 8.5 },
    },
  },

  // Místní komunikace M
  'M': {
    jarni: {
      category1: { po: 14.2, ut: 14.6, st: 14.8, ct: 14.8, pa: 15.1, so: 13.0, ne: 13.5 },
      category2: { po: 15.8, ut: 15.8, st: 15.9, ct: 15.9, pa: 15.7, so: 11.0, ne: 9.9 },
      category3: { po: 16.0, ut: 15.9, st: 16.0, ct: 16.0, pa: 15.8, so: 10.6, ne: 9.7 },
    },
    prazdninove: {
      category1: { po: 13.9, ut: 14.3, st: 14.5, ct: 14.6, pa: 14.9, so: 13.8, ne: 14.0 },
      category2: { po: 15.6, ut: 15.7, st: 15.8, ct: 15.8, pa: 15.6, so: 11.3, ne: 10.2 },
      category3: { po: 15.8, ut: 15.8, st: 15.9, ct: 15.9, pa: 15.7, so: 10.9, ne: 10.0 },
    },
    podzimni: {
      category1: { po: 14.3, ut: 14.7, st: 14.9, ct: 14.9, pa: 15.2, so: 12.8, ne: 13.2 },
      category2: { po: 15.9, ut: 15.9, st: 16.0, ct: 16.0, pa: 15.8, so: 10.8, ne: 9.6 },
      category3: { po: 16.1, ut: 16.0, st: 16.1, ct: 16.1, pa: 15.9, so: 10.4, ne: 9.4 },
    },
    zimni: {
      category1: { po: 14.4, ut: 14.8, st: 15.0, ct: 15.0, pa: 15.3, so: 12.6, ne: 12.9 },
      category2: { po: 16.0, ut: 16.0, st: 16.1, ct: 16.1, pa: 15.9, so: 10.6, ne: 9.3 },
      category3: { po: 16.2, ut: 16.1, st: 16.2, ct: 16.2, pa: 16.0, so: 10.2, ne: 9.1 },
    },
  },
};

// =============================================================================
// ROČNÍ VARIACE (Příloha 3.1-3.6) - podíly měsíců na ročním průměru
// =============================================================================

// Struktura: [roadType][vehicleCategory][month] = koeficient
// month: 1-12 (leden = 1, prosinec = 12)

export const YEARLY_VARIATION: Record<RoadType, Record<string, number[]>> = {
  // Dálnice D-I (Příloha 3.1)
  'D-I': {
    // Index 0 = leden, index 11 = prosinec
    category1: [7.2, 7.5, 8.3, 8.5, 8.7, 8.9, 9.3, 9.2, 8.6, 8.5, 7.9, 7.4],
    category2: [7.8, 7.9, 8.5, 8.6, 8.7, 8.7, 8.9, 8.8, 8.6, 8.7, 8.4, 8.4],
    category3: [7.9, 8.0, 8.6, 8.7, 8.7, 8.7, 8.8, 8.7, 8.6, 8.7, 8.5, 8.5],
  },

  // Dálnice D-II
  'D-II': {
    category1: [7.1, 7.4, 8.2, 8.4, 8.6, 9.0, 9.4, 9.3, 8.7, 8.6, 7.9, 7.4],
    category2: [7.7, 7.8, 8.4, 8.5, 8.7, 8.8, 9.0, 8.9, 8.7, 8.8, 8.5, 8.4],
    category3: [7.8, 7.9, 8.5, 8.6, 8.7, 8.8, 8.9, 8.8, 8.7, 8.8, 8.6, 8.5],
  },

  // Silnice E
  'E': {
    category1: [7.3, 7.6, 8.3, 8.5, 8.7, 8.9, 9.2, 9.1, 8.6, 8.5, 7.9, 7.4],
    category2: [7.9, 8.0, 8.6, 8.7, 8.7, 8.7, 8.8, 8.7, 8.6, 8.7, 8.5, 8.5],
    category3: [8.0, 8.1, 8.7, 8.8, 8.8, 8.7, 8.8, 8.7, 8.6, 8.7, 8.6, 8.6],
  },

  // Silnice I
  'I': {
    category1: [7.4, 7.7, 8.4, 8.5, 8.7, 8.8, 9.1, 9.0, 8.6, 8.5, 7.9, 7.4],
    category2: [8.0, 8.1, 8.7, 8.8, 8.8, 8.7, 8.7, 8.6, 8.6, 8.7, 8.6, 8.6],
    category3: [8.1, 8.2, 8.8, 8.9, 8.9, 8.7, 8.6, 8.5, 8.6, 8.7, 8.7, 8.7],
  },

  // Silnice II-H
  'II-H': {
    category1: [7.5, 7.8, 8.4, 8.6, 8.7, 8.8, 9.0, 8.9, 8.6, 8.5, 7.9, 7.4],
    category2: [8.1, 8.2, 8.8, 8.9, 8.9, 8.7, 8.6, 8.5, 8.6, 8.7, 8.7, 8.7],
    category3: [8.2, 8.3, 8.9, 9.0, 9.0, 8.7, 8.5, 8.4, 8.6, 8.7, 8.8, 8.8],
  },

  // Silnice II-S
  'II-S': {
    category1: [7.6, 7.9, 8.5, 8.6, 8.8, 8.7, 8.9, 8.8, 8.6, 8.5, 7.9, 7.4],
    category2: [8.2, 8.3, 8.9, 9.0, 9.0, 8.6, 8.5, 8.4, 8.6, 8.7, 8.8, 8.8],
    category3: [8.3, 8.4, 9.0, 9.1, 9.1, 8.6, 8.4, 8.3, 8.6, 8.7, 8.9, 8.9],
  },

  // Silnice II-R-L (rekreační letní)
  'II-R-L': {
    category1: [7.7, 8.0, 8.5, 8.7, 8.8, 8.7, 8.8, 8.7, 8.6, 8.5, 7.9, 7.4],
    category2: [8.3, 8.4, 9.0, 9.1, 9.1, 8.5, 8.4, 8.3, 8.6, 8.7, 8.9, 8.9],
    category3: [8.4, 8.5, 9.1, 9.2, 9.2, 8.5, 8.3, 8.2, 8.6, 8.7, 9.0, 9.0],
  },

  // Silnice II-R-Z (rekreační zimní)
  'II-R-Z': {
    category1: [7.8, 8.1, 8.6, 8.7, 8.9, 8.6, 8.7, 8.6, 8.6, 8.5, 7.9, 7.4],
    category2: [8.4, 8.5, 9.1, 9.2, 9.2, 8.4, 8.3, 8.2, 8.6, 8.7, 9.0, 9.0],
    category3: [8.5, 8.6, 9.2, 9.3, 9.3, 8.4, 8.2, 8.1, 8.6, 8.7, 9.1, 9.1],
  },

  // Místní komunikace M
  'M': {
    category1: [7.6, 7.9, 8.5, 8.6, 8.8, 8.7, 8.9, 8.8, 8.6, 8.5, 7.9, 7.4],
    category2: [8.2, 8.3, 8.9, 9.0, 9.0, 8.6, 8.5, 8.4, 8.6, 8.7, 8.8, 8.8],
    category3: [8.3, 8.4, 9.0, 9.1, 9.1, 8.6, 8.4, 8.3, 8.6, 8.7, 8.9, 8.9],
  },
};
