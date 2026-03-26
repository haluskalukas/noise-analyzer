export interface Train {
  id: string;
  startTime: Date;
  endTime: Date;
  trakce: string; // editable
  druhVlaku: string; // editable
  pocetVozu: string; // editable
  smer: string; // editable
  poznamka: string; // editable
  laeq: number; // calculated from selected interval
  casPrujezdu: number; // calculated duration in seconds
  lae: number; // calculated: 10*LOG10(10^(LAeq/10) * duration)
  startIndex: number; // for highlighting in graph
  endIndex: number; // for highlighting in graph
}
