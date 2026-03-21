export interface TrainCategory {
  kategorie: string; // unique train type name (druhVlaku)
  laeAverage: number; // logarithmic average of LAE values
  pocetVlakuDen: number; // count of trains during day (editable)
  pocetVlakuNoc: number; // count of trains during night (editable)
  celkovyHlukDen: number; // calculated: 10*LOG10((10^(laeAverage/10) * pocetVlakuDen) / 57600)
  celkovyHlukNoc: number; // calculated: 10*LOG10((10^(laeAverage/10) * pocetVlakuNoc) / 28800)
  trainIds: string[]; // IDs of trains in this category
}
