'use client';

import { Train } from '@/types/train';
import { TrainCategory } from '@/types/train-calculation';
import { formatNumber } from '@/lib/format';
import { useMemo, useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

interface TrainCalculationsProps {
  trains: Train[];
}

export function TrainCalculations({ trains }: TrainCalculationsProps) {
  // Store user inputs separately to avoid circular dependency
  const [userInputs, setUserInputs] = useState<Map<string, { pocetVlakuDen: number; pocetVlakuNoc: number }>>(new Map());

  // Group trains by category and calculate LAE averages (pure calculation, no dependency on state)
  const categories = useMemo(() => {
    const categoryMap = new Map<string, Train[]>();

    // Group trains by druhVlaku
    trains.forEach(train => {
      const key = train.druhVlaku.trim() || '(bez kategorie)';
      if (!categoryMap.has(key)) {
        categoryMap.set(key, []);
      }
      categoryMap.get(key)!.push(train);
    });

    // Calculate logarithmic average of LAE for each category
    const cats: TrainCategory[] = [];
    categoryMap.forEach((categoryTrains, kategorie) => {
      // Logarithmic average: 10 * log10(1/n * sum(10^(LAE/10)))
      const sumOfPowers = categoryTrains.reduce((sum, train) =>
        sum + Math.pow(10, train.lae / 10), 0
      );
      const laeAverage = 10 * Math.log10(sumOfPowers / categoryTrains.length);

      // Get user inputs for this category
      const inputs = userInputs.get(kategorie);
      const pocetVlakuDen = inputs?.pocetVlakuDen ?? 0;
      const pocetVlakuNoc = inputs?.pocetVlakuNoc ?? 0;

      // Calculate total noise
      const delogaritmovanyPrumer = Math.pow(10, laeAverage / 10);
      const celkovyHlukDen = pocetVlakuDen > 0
        ? 10 * Math.log10((delogaritmovanyPrumer * pocetVlakuDen) / 57600)
        : 0;
      const celkovyHlukNoc = pocetVlakuNoc > 0
        ? 10 * Math.log10((delogaritmovanyPrumer * pocetVlakuNoc) / 28800)
        : 0;

      cats.push({
        kategorie,
        laeAverage,
        pocetVlakuDen,
        pocetVlakuNoc,
        celkovyHlukDen,
        celkovyHlukNoc,
        trainIds: categoryTrains.map(t => t.id),
      });
    });

    return cats.sort((a, b) => a.kategorie.localeCompare(b.kategorie));
  }, [trains, userInputs]);

  const handleCountChange = (kategorie: string, field: 'pocetVlakuDen' | 'pocetVlakuNoc', value: string) => {
    const numValue = parseInt(value) || 0;
    setUserInputs(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(kategorie) || { pocetVlakuDen: 0, pocetVlakuNoc: 0 };
      newMap.set(kategorie, { ...existing, [field]: numValue });
      return newMap;
    });
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    const data = [
      ['Dopočet hluku z železniční dopravy', '', '', '', '', ''],
      ['', '', '', '', '', ''],
      ['Kategorie vlaku', 'L_AE průměr (dB)', 'Počet vlaků den', 'Celk. hluk den (dB)', 'Počet vlaků noc', 'Celk. hluk noc (dB)'],
    ];

    categories.forEach(cat => {
      data.push([
        cat.kategorie,
        formatNumber(cat.laeAverage),
        cat.pocetVlakuDen.toString(),
        cat.pocetVlakuDen > 0 ? formatNumber(cat.celkovyHlukDen) : '-',
        cat.pocetVlakuNoc.toString(),
        cat.pocetVlakuNoc > 0 ? formatNumber(cat.celkovyHlukNoc) : '-',
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Dopočet');

    const timestamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `zeleznicni_doprava_dopocet_${timestamp}.xlsx`);
  };

  if (trains.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <p className="text-blue-800 font-medium mb-2">
          Nejprve přidej vlaky v grafu
        </p>
        <p className="text-blue-600 text-sm">
          Pro dopočet je potřeba mít alespoň jeden vlak přidaný
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Export Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Dopočet hluku na celou denní a noční dobu
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Kategorie vlaků jsou automaticky vytvořeny podle „Druh vlaku"
          </p>
        </div>
        <button
          onClick={exportToExcel}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md flex items-center gap-2"
        >
          📥 Export do Excel
        </button>
      </div>

      {/* Categories Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kategorie vlaku
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                L<sub>AE</sub> průměr (dB)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Počet vlaků den
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Celkový hluk den (dB)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Počet vlaků noc
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Celkový hluk noc (dB)
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.map((cat) => (
              <tr key={cat.kategorie} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">
                  {cat.kategorie}
                  <span className="ml-2 text-xs text-gray-500">
                    ({cat.trainIds.length} {cat.trainIds.length === 1 ? 'vlak' : 'vlaků'})
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-blue-700 font-semibold">
                  {formatNumber(cat.laeAverage)}
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={cat.pocetVlakuDen || ''}
                    onChange={(e) => handleCountChange(cat.kategorie, 'pocetVlakuDen', e.target.value)}
                    placeholder="0"
                    className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </td>
                <td className="px-4 py-3 whitespace-nowrap font-semibold text-orange-700">
                  {cat.pocetVlakuDen > 0 ? formatNumber(cat.celkovyHlukDen) : '-'}
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={cat.pocetVlakuNoc || ''}
                    onChange={(e) => handleCountChange(cat.kategorie, 'pocetVlakuNoc', e.target.value)}
                    placeholder="0"
                    className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </td>
                <td className="px-4 py-3 whitespace-nowrap font-semibold text-indigo-700">
                  {cat.pocetVlakuNoc > 0 ? formatNumber(cat.celkovyHlukNoc) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Formula explanation */}
      <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-600 space-y-2">
        <p className="font-semibold mb-2">Výpočty:</p>
        <ul className="space-y-1 ml-4">
          <li>
            <strong>L<sub>AE</sub> průměr</strong> = logaritmický průměr z L<sub>AE</sub> všech vlaků v kategorii
            <br />
            <span className="text-gray-500 ml-4">= 10 × log₁₀(1/n × Σ 10^(L<sub>AE,i</sub>/10))</span>
          </li>
          <li>
            <strong>Celkový hluk den</strong> = 10 × log₁₀((10^(L<sub>AE,průměr</sub>/10) × počet vlaků) / 57600)
            <br />
            <span className="text-gray-500 ml-4">57600 s = 16 hodin denní doby (6:00-22:00)</span>
          </li>
          <li>
            <strong>Celkový hluk noc</strong> = 10 × log₁₀((10^(L<sub>AE,průměr</sub>/10) × počet vlaků) / 28800)
            <br />
            <span className="text-gray-500 ml-4">28800 s = 8 hodin noční doby (22:00-6:00)</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
