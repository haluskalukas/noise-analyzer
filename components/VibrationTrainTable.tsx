'use client';

import { useState } from 'react';
import { VibrationTrain, LIMIT_DB } from '@/types/vibration';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { VibrationTrainDetail } from './VibrationTrainDetail';

interface VibrationTrainTableProps {
  trains: VibrationTrain[];
  onUpdateTrain: (id: string, field: keyof VibrationTrain, value: string) => void;
  onDeleteTrain: (id: string) => void;
}

export function VibrationTrainTable({
  trains,
  onUpdateTrain,
  onDeleteTrain,
}: VibrationTrainTableProps) {
  const [selectedTrain, setSelectedTrain] = useState<VibrationTrain | null>(null);
  const handleExport = () => {
    if (trains.length === 0) {
      alert('Žádná data k exportu');
      return;
    }

    // Prepare data for export
    const exportData = trains.map((train, index) => ({
      'Číslo': index + 1,
      'Čas začátku': format(train.startTime, 'HH:mm:ss'),
      'Čas konce': format(train.endTime, 'HH:mm:ss'),
      'Trakce': train.trakce,
      'Druh vlaku': train.druhVlaku,
      'Počet vozů': train.pocetVozu,
      'Směr': train.smer,
      'Law X (dB)': train.lawX.toFixed(2),
      'Law Y (dB)': train.lawY.toFixed(2),
      'Law Z (dB)': train.lawZ.toFixed(2),
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    ws['!cols'] = [
      { wch: 8 },  // Číslo
      { wch: 12 }, // Čas začátku
      { wch: 12 }, // Čas konce
      { wch: 15 }, // Trakce
      { wch: 15 }, // Druh vlaku
      { wch: 12 }, // Počet vozů
      { wch: 10 }, // Směr
      { wch: 12 }, // Law X
      { wch: 12 }, // Law Y
      { wch: 12 }, // Law Z
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Vlaky - vibrace');

    // Export
    XLSX.writeFile(wb, `vibrace_vlaky_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.xlsx`);
  };

  if (trains.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🚂</div>
        <p className="text-gray-600">Zatím nejsou vybrány žádné vlaky</p>
        <p className="text-sm text-gray-500 mt-2">
          Použij Alt + tažení myší v grafu pro výběr průjezdu vlaku
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Seznam vlaků ({trains.length})
        </h3>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors flex items-center gap-2"
        >
          📊 Exportovat do Excelu
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                #
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Čas
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Trakce
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Druh vlaku
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Počet vozů
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Směr
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                L<sub>aw</sub> X (dB)
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                L<sub>aw</sub> Y (dB)
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                L<sub>aw</sub> Z (dB)
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                Akce
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {trains.map((train, index) => (
              <tr key={train.id} className="hover:bg-gray-50">
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                  {index + 1}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                  <div>{format(train.startTime, 'HH:mm:ss')}</div>
                  <div className="text-xs text-gray-500">
                    {format(train.endTime, 'HH:mm:ss')}
                  </div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <input
                    type="text"
                    value={train.trakce}
                    onChange={(e) => onUpdateTrain(train.id, 'trakce', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="el/mech"
                  />
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <input
                    type="text"
                    value={train.druhVlaku}
                    onChange={(e) => onUpdateTrain(train.id, 'druhVlaku', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Os/Nex/..."
                  />
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <input
                    type="text"
                    value={train.pocetVozu}
                    onChange={(e) => onUpdateTrain(train.id, 'pocetVozu', e.target.value)}
                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="5"
                  />
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <input
                    type="text"
                    value={train.smer}
                    onChange={(e) => onUpdateTrain(train.id, 'smer', e.target.value)}
                    className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Praha/Brno"
                  />
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm">
                  <span className={train.lawX > LIMIT_DB ? 'text-red-600 font-semibold' : 'text-gray-900'}>
                    {train.lawX.toFixed(1)}
                  </span>
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm">
                  <span className={train.lawY > LIMIT_DB ? 'text-red-600 font-semibold' : 'text-gray-900'}>
                    {train.lawY.toFixed(1)}
                  </span>
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm">
                  <span className={train.lawZ > LIMIT_DB ? 'text-red-600 font-semibold' : 'text-gray-900'}>
                    {train.lawZ.toFixed(1)}
                  </span>
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setSelectedTrain(train)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                      title="Zobrazit detail"
                    >
                      📊 Detail
                    </button>
                    <button
                      onClick={() => onDeleteTrain(train.id)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                      title="Smazat vlak"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Train Detail Modal */}
      {selectedTrain && (
        <VibrationTrainDetail
          train={selectedTrain}
          onClose={() => setSelectedTrain(null)}
        />
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800">
          <strong>ℹ️ Vysvětlivky:</strong>
        </p>
        <ul className="text-xs text-amber-700 mt-2 space-y-1">
          <li>• <strong>L<sub>aw</sub></strong> = Vážená hladina vibrační akcelerace (dB)</li>
          <li>• <strong>X</strong> = podélný směr (ve směru tratě)</li>
          <li>• <strong>Y</strong> = příčný směr (kolmo na trať)</li>
          <li>• <strong>Z</strong> = svislý směr</li>
          <li>• <strong className="text-red-600">Červeně</strong> = hodnota překračuje limit {LIMIT_DB} dB</li>
        </ul>
      </div>
    </div>
  );
}
