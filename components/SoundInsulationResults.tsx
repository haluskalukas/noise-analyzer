'use client';

import { FrequencyMeasurement, RoomParameters, calculateWeightedIndex, FrequencyResult } from '@/app/nepruzvucnost/page';
import * as XLSX from 'xlsx';

interface SoundInsulationResultsProps {
  measurements: FrequencyMeasurement[];
  roomParams: RoomParameters;
  fileName: string;
}

interface CalculatedResult {
  frequency: number;
  L1: number;
  L2: number;
  T: number;
  A: number;
  R: number;
  DnT: number;
}

export default function SoundInsulationResults({
  measurements,
  roomParams,
  fileName,
}: SoundInsulationResultsProps) {
  // Výpočet všech hodnot
  const calculateResults = (): CalculatedResult[] => {
    return measurements.map((m) => {
      // A = 0.163 × V / T [m²]
      const A = (0.163 * roomParams.volume) / m.T;

      // R' = L1 - L2 + 10 × log(S/A) [dB]
      const R = m.L1 - m.L2 + 10 * Math.log10(roomParams.area / A);

      // DnT = L1 - L2 + 10 × log(T/0.5) [dB]
      const DnT = m.L1 - m.L2 + 10 * Math.log10(m.T / 0.5);

      return {
        frequency: m.frequency,
        L1: m.L1,
        L2: m.L2,
        T: m.T,
        A,
        R,
        DnT,
      };
    });
  };

  const results = calculateResults();

  // Průměrné hodnoty
  const avgR = results.reduce((sum, r) => sum + r.R, 0) / results.length;
  const avgDnT = results.reduce((sum, r) => sum + r.DnT, 0) / results.length;
  const avgT = results.reduce((sum, r) => sum + r.T, 0) / results.length;

  // Vypočítat vážené indexy
  const resultsForCalc: FrequencyResult[] = results.map(r => ({ ...r }));
  const Rw = calculateWeightedIndex(resultsForCalc);

  // Pro DnT,w použijeme stejný algoritmus, ale s DnT hodnotami
  const resultsForDnT: FrequencyResult[] = results.map(r => ({
    ...r,
    R: r.DnT  // Použijeme DnT místo R pro výpočet
  }));
  const DnTw = calculateWeightedIndex(resultsForDnT);

  // Export do Excel
  const handleExportExcel = () => {
    const exportData = results.map((r) => ({
      'Frekvence [Hz]': r.frequency,
      'L1 [dB]': r.L1.toFixed(1),
      'L2 [dB]': r.L2.toFixed(1),
      'T [s]': r.T.toFixed(2),
      'A [m²]': r.A.toFixed(2),
      "R' [dB]": r.R.toFixed(1),
      'DnT [dB]': r.DnT.toFixed(1),
    }));

    // Přidat parametry na začátek
    const headerData = [
      { 'Frekvence [Hz]': 'PARAMETRY MÍSTNOSTI' },
      { 'Frekvence [Hz]': `Objem přijímací místnosti V = ${roomParams.volume} m³` },
      { 'Frekvence [Hz]': `Plocha měřené konstrukce S = ${roomParams.area} m²` },
      { 'Frekvence [Hz]': '' },
      { 'Frekvence [Hz]': 'VÝSLEDKY MĚŘENÍ' },
    ];

    const ws = XLSX.utils.json_to_sheet([...headerData, ...exportData], { skipHeader: false });

    // Přidat souhrn na konec
    XLSX.utils.sheet_add_json(
      ws,
      [
        { 'Frekvence [Hz]': '' },
        { 'Frekvence [Hz]': 'PRŮMĚRNÉ HODNOTY' },
        { 'Frekvence [Hz]': "R' průměr", 'L1 [dB]': avgR.toFixed(1) + ' dB' },
        { 'Frekvence [Hz]': 'DnT průměr', 'L1 [dB]': avgDnT.toFixed(1) + ' dB' },
        { 'Frekvence [Hz]': 'T průměr', 'L1 [dB]': avgT.toFixed(2) + ' s' },
      ],
      { skipHeader: true, origin: -1 }
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Neprůzvučnost');

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    XLSX.writeFile(wb, `nepruzvucnost_${timestamp}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Weighted Index Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* R'w */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 border-2 border-blue-800 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">
              Vážená stavební neprůzvučnost
            </h3>
            <span className="text-3xl">⭐</span>
          </div>
          <div className="text-5xl font-bold">
            {Rw.value} <span className="text-2xl">dB</span>
          </div>
          <p className="text-sm mt-2 opacity-90">R'w (ISO 717-1)</p>
          <div className="mt-3 pt-3 border-t border-blue-500 text-xs opacity-75">
            <p>Posun křivky: {Rw.shift > 0 ? '+' : ''}{Rw.shift} dB</p>
            <p>Nepříznivé odchylky: {Rw.unfavorableDeviations.toFixed(1).replace('.', ',')} dB</p>
          </div>
        </div>

        {/* DnT,w */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg shadow-lg p-6 border-2 border-emerald-800 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">
              Vážený normovaný rozdíl hladin
            </h3>
            <span className="text-3xl">⭐</span>
          </div>
          <div className="text-5xl font-bold">
            {DnTw.value} <span className="text-2xl">dB</span>
          </div>
          <p className="text-sm mt-2 opacity-90">DnT,w (ISO 717-1)</p>
          <div className="mt-3 pt-3 border-t border-emerald-500 text-xs opacity-75">
            <p>Posun křivky: {DnTw.shift > 0 ? '+' : ''}{DnTw.shift} dB</p>
            <p>Nepříznivé odchylky: {DnTw.unfavorableDeviations.toFixed(1).replace('.', ',')} dB</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Average R' */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-md p-6 border-2 border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-blue-900">
              Průměrná stavební neprůzvučnost
            </h3>
            <span className="text-2xl">🔊</span>
          </div>
          <div className="text-3xl font-bold text-blue-700">
            {avgR.toFixed(1).replace('.', ',')} <span className="text-xl">dB</span>
          </div>
          <p className="text-xs text-blue-600 mt-1">R' průměr</p>
        </div>

        {/* Average DnT */}
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg shadow-md p-6 border-2 border-emerald-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-emerald-900">
              Průměrný normovaný rozdíl hladin
            </h3>
            <span className="text-2xl">📉</span>
          </div>
          <div className="text-3xl font-bold text-emerald-700">
            {avgDnT.toFixed(1).replace('.', ',')} <span className="text-xl">dB</span>
          </div>
          <p className="text-xs text-emerald-600 mt-1">DnT průměr</p>
        </div>

        {/* Average T */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-md p-6 border-2 border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-purple-900">
              Průměrná doba dozvuku
            </h3>
            <span className="text-2xl">⏱️</span>
          </div>
          <div className="text-3xl font-bold text-purple-700">
            {avgT.toFixed(2).replace('.', ',')} <span className="text-xl">s</span>
          </div>
          <p className="text-xs text-purple-600 mt-1">T průměr</p>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            📋 Tabulka výsledků
          </h2>
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
          >
            📥 Exportovat do Excel
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Frekvence<br />[Hz]
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  L1<br />[dB]
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  L2<br />[dB]
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  T<br />[s]
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  A<br />[m²]
                </th>
                <th className="px-4 py-3 text-left font-semibold text-blue-700 bg-blue-50">
                  R'<br />[dB]
                </th>
                <th className="px-4 py-3 text-left font-semibold text-emerald-700 bg-emerald-50">
                  DnT<br />[dB]
                </th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, i) => (
                <tr
                  key={result.frequency}
                  className={`border-b border-gray-200 ${
                    i % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  } hover:bg-blue-50 transition-colors`}
                >
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {result.frequency}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {result.L1.toFixed(1).replace('.', ',')}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {result.L2.toFixed(1).replace('.', ',')}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {result.T.toFixed(2).replace('.', ',')}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {result.A.toFixed(2).replace('.', ',')}
                  </td>
                  <td className="px-4 py-3 font-semibold text-blue-700 bg-blue-50">
                    {result.R.toFixed(1).replace('.', ',')}
                  </td>
                  <td className="px-4 py-3 font-semibold text-emerald-700 bg-emerald-50">
                    {result.DnT.toFixed(1).replace('.', ',')}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-200 border-t-2 border-gray-400 font-bold">
                <td className="px-4 py-3 text-gray-900" colSpan={5}>
                  Průměr
                </td>
                <td className="px-4 py-3 text-blue-700 bg-blue-100">
                  {avgR.toFixed(1).replace('.', ',')}
                </td>
                <td className="px-4 py-3 text-emerald-700 bg-emerald-100">
                  {avgDnT.toFixed(1).replace('.', ',')}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="mt-4 p-4 bg-gray-50 rounded border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-2">ℹ️ Vysvětlivky:</h3>
          <ul className="text-xs text-gray-700 space-y-1">
            <li>
              <strong>L1</strong> - Hladina akustického tlaku ve vysílací místnosti [dB]
            </li>
            <li>
              <strong>L2</strong> - Hladina akustického tlaku v přijímací místnosti [dB]
            </li>
            <li>
              <strong>T</strong> - Doba dozvuku v přijímací místnosti [s]
            </li>
            <li>
              <strong>A</strong> - Ekvivalentní pohltivá plocha: A = 0.163 × V / T [m²]
            </li>
            <li>
              <strong>R'</strong> - Stavební neprůzvučnost: R' = L1 - L2 + 10 × log(S/A) [dB]
            </li>
            <li>
              <strong>DnT</strong> - Normovaný rozdíl hladin: DnT = L1 - L2 + 10 × log(T/0.5) [dB]
            </li>
            <li>
              <strong>R'w / DnT,w</strong> - Vážená jednočíselná hodnota podle ISO 717-1 [dB]
            </li>
          </ul>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">📊 Vstupní parametry:</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-700 font-medium">Objem přijímací místnosti (V):</span>
              <span className="ml-2 font-bold">{roomParams.volume} m³</span>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Plocha měřené konstrukce (S):</span>
              <span className="ml-2 font-bold">{roomParams.area} m²</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
