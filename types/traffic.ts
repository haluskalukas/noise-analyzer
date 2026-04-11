// Traffic counting types for automotive module

export type VehicleCategory = 'OA' | 'LN' | 'N' | 'A' | 'M' | 'K';

export interface HourlyTrafficCount {
  hour: number; // 0-23
  OA: number;  // Osobní automobily
  LN: number;  // Lehké nákladní
  N: number;   // Nákladní
  A: number;   // Autobusy
  M: number;   // Motorky
  K: number;   // Kamiony
}

export interface TrafficSummary {
  day: CategoryCounts;    // 6-22h
  night: CategoryCounts;  // 22-6h
  total: CategoryCounts;  // 24h
}

export interface CategoryCounts {
  OA: number;
  LN: number;
  N: number;
  A: number;
  M: number;
  K: number;
}

export interface GroupedTrafficSummary {
  day: GroupedCounts;
  night: GroupedCounts;
  total: GroupedCounts;
}

export interface GroupedCounts {
  category1: number; // OA + LN + M
  category2: number; // A + N
  category3: number; // K
}

export interface TrafficCountingData {
  hourlyCounts: HourlyTrafficCount[];
  summary: TrafficSummary;
  grouped: GroupedTrafficSummary;
}
