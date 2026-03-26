'use client';

import { Train } from '@/types/train';
import * as XLSX from 'xlsx';
import { formatNumber } from '@/lib/format';

interface TrainTableProps {
  trains: Train[];
  onUpdateTrain: (id: string, field: keyof Train, value: string) => void;
  onDeleteTrain: (id: string) => void;
}

export function TrainTable({ trains, onUpdateTrain, onDeleteTrain }: TrainTableProps) {
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    const data = [
      ['Železniční doprava - hluk', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', ''],
      ['Čas', 'Trakce', 'Druh vlaku', 'Počet vozů', 'Směr', 'Poznámka', 'LAeq (dB)', 'Čas průjezdu (s)', 'LAE (dB)'],
    ];

    trains.forEach(train => {
      const startTime = `${train.startTime.getHours().toString().padStart(2, '0')}:${train.startTime.getMinutes().toString().padStart(2, '0')}:${train.startTime.getSeconds().toString().padStart(2, '0')}`;
      const endTime = `${train.endTime.getHours().toString().padStart(2, '0')}:${train.endTime.getMinutes().toString().padStart(2, '0')}:${train.endTime.getSeconds().toString().padStart(2, '0')}`;

      data.push([
        `${startTime} - ${endTime}`,
        train.trakce,
        train.druhVlaku,
        train.pocetVozu,
        train.smer,
        train.poznamka,
        formatNumber(train.laeq),
        formatNumber(train.casPrujezdu),
        formatNumber(train.lae),
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Vlaky');

    const timestamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `zeleznicni_doprava_${timestamp}.xlsx`);
  };

  return (
    <div className="space-y-4">
      {/* Export Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Seznam průjezdů vlaků ({trains.length})
        </h3>
        {trains.length > 0 && (
          <button
            onClick={exportToExcel}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md flex items-center gap-2"
          >
            📥 Export do Excel
          </button>
        )}
      </div>

      {/* Table */}
      {trains.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-blue-800 font-medium mb-2">
            Žádné vlaky ještě nebyly přidány
          </p>
          <p className="text-blue-600 text-sm">
            Použij Alt + tažení myší v grafu pro výběr průjezdu vlaku
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Čas průjezdu
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trakce
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Druh vlaku
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Počet vozů
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Směr
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Poznámka
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  L<sub>Aeq</sub> (dB)
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Čas (s)
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  L<sub>AE</sub> (dB)
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Akce
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {trains.map((train) => (
                <tr key={train.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3 whitespace-nowrap font-medium text-gray-900">
                    {train.startTime.getHours().toString().padStart(2, '0')}:
                    {train.startTime.getMinutes().toString().padStart(2, '0')}:
                    {train.startTime.getSeconds().toString().padStart(2, '0')}
                    {' - '}
                    {train.endTime.getHours().toString().padStart(2, '0')}:
                    {train.endTime.getMinutes().toString().padStart(2, '0')}:
                    {train.endTime.getSeconds().toString().padStart(2, '0')}
                  </td>
                  <td className="px-3 py-3">
                    <input
                      type="text"
                      value={train.trakce}
                      onChange={(e) => onUpdateTrain(train.id, 'trakce', e.target.value)}
                      placeholder="např. elektrická"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <input
                      type="text"
                      value={train.druhVlaku}
                      onChange={(e) => onUpdateTrain(train.id, 'druhVlaku', e.target.value)}
                      placeholder="např. nákladní"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <input
                      type="text"
                      value={train.pocetVozu}
                      onChange={(e) => onUpdateTrain(train.id, 'pocetVozu', e.target.value)}
                      placeholder="např. 15"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <input
                      type="text"
                      value={train.smer}
                      onChange={(e) => onUpdateTrain(train.id, 'smer', e.target.value)}
                      placeholder="např. Praha → Brno"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <input
                      type="text"
                      value={train.poznamka}
                      onChange={(e) => onUpdateTrain(train.id, 'poznamka', e.target.value)}
                      placeholder="např. odbočka, zpoždění"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-gray-700 font-semibold">
                    {formatNumber(train.laeq)}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-gray-600">
                    {formatNumber(train.casPrujezdu)}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-blue-700 font-semibold">
                    {formatNumber(train.lae)}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <button
                      onClick={() => onDeleteTrain(train.id)}
                      className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs font-medium transition-colors"
                    >
                      Smazat
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Formula explanation */}
      {trains.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-600">
          <p className="font-semibold mb-1">Výpočty:</p>
          <ul className="space-y-0.5 ml-4">
            <li><strong>L<sub>Aeq</sub></strong> = logaritmický průměr z vybraného intervalu průjezdu</li>
            <li><strong>Čas průjezdu</strong> = doba trvání vybraného intervalu (v sekundách)</li>
            <li><strong>L<sub>AE</sub></strong> = 10 × log₁₀(10^(L<sub>Aeq</sub>/10) × čas průjezdu)</li>
          </ul>
        </div>
      )}
    </div>
  );
}
