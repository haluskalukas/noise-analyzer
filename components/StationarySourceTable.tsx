'use client';

import { useState } from 'react';
import { StationarySource } from '@/types/stationary';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { StationarySourceDetail } from './StationarySourceDetail';
import { formatNumber } from '@/lib/format';

interface StationarySourceTableProps {
  sources: StationarySource[];
  onUpdateSource: (id: string, field: keyof StationarySource, value: string) => void;
  onDeleteSource: (id: string) => void;
}

export function StationarySourceTable({
  sources,
  onUpdateSource,
  onDeleteSource,
}: StationarySourceTableProps) {
  const [selectedSource, setSelectedSource] = useState<StationarySource | null>(null);

  const handleExport = () => {
    if (sources.length === 0) {
      alert('Žádná data k exportu');
      return;
    }

    // Prepare data for export
    const exportData = sources.map((source, index) => ({
      'Číslo': index + 1,
      'Název': source.name,
      'Typ': source.type === 'source' ? 'Zdroj hluku' : 'Hluk pozadí',
      'Čas začátku': format(source.startTime, 'HH:mm:ss'),
      'Čas konce': format(source.endTime, 'HH:mm:ss'),
      'LAeq (dB)': formatNumber(source.laeq),
      'L5 (dB)': formatNumber(source.l5),
      'L10 (dB)': formatNumber(source.l10),
      'L50 (dB)': formatNumber(source.l50),
      'L90 (dB)': formatNumber(source.l90),
      'L95 (dB)': formatNumber(source.l95),
      'Min (dB)': formatNumber(source.min),
      'Max (dB)': formatNumber(source.max),
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    ws['!cols'] = [
      { wch: 8 },  // Číslo
      { wch: 20 }, // Název
      { wch: 15 }, // Typ
      { wch: 12 }, // Čas začátku
      { wch: 12 }, // Čas konce
      { wch: 12 }, // LAeq
      { wch: 10 }, // L5
      { wch: 10 }, // L10
      { wch: 10 }, // L50
      { wch: 10 }, // L90
      { wch: 10 }, // L95
      { wch: 10 }, // Min
      { wch: 10 }, // Max
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stacionární zdroje');

    // Export
    XLSX.writeFile(wb, `stacionarni_zdroje_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.xlsx`);
  };

  if (sources.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🏭</div>
        <p className="text-gray-600">Zatím nejsou vybrána žádná měření</p>
        <p className="text-sm text-gray-500 mt-2">
          Použij Alt + tažení myší v grafu pro výběr intervalu měření
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Seznam měření ({sources.length})
        </h3>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md transition-colors flex items-center gap-2"
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
                Název zdroje
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 tracking-wider">
                LAeq (dB)
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 tracking-wider">
                L5 (dB)
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 tracking-wider">
                L10 (dB)
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 tracking-wider">
                L50 (dB)
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 tracking-wider">
                L90 (dB)
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 tracking-wider">
                L95 (dB)
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                Akce
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sources.map((source, index) => (
              <tr
                key={source.id}
                className={`hover:bg-gray-50 ${source.type === 'source' ? 'bg-orange-50/30' : 'bg-blue-50/30'}`}
              >
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                  {index + 1}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                  <div>{format(source.startTime, 'HH:mm:ss')}</div>
                  <div className="text-xs text-gray-500">
                    {format(source.endTime, 'HH:mm:ss')}
                  </div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <input
                    type="text"
                    value={source.name}
                    onChange={(e) => onUpdateSource(source.id, 'name', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder={source.type === 'source' ? 'Zdroj hluku' : 'Hluk pozadí'}
                  />
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 font-semibold">
                  {formatNumber(source.laeq)}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                  {formatNumber(source.l5)}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                  {formatNumber(source.l10)}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                  {formatNumber(source.l50)}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                  {formatNumber(source.l90)}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                  {formatNumber(source.l95)}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setSelectedSource(source)}
                      className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-xs rounded transition-colors"
                      title="Zobrazit detail"
                    >
                      📊 Detail
                    </button>
                    <button
                      onClick={() => onDeleteSource(source.id)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                      title="Smazat měření"
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

      {/* Source Detail Modal */}
      {selectedSource && (
        <StationarySourceDetail
          source={selectedSource}
          allSources={sources}
          onClose={() => setSelectedSource(null)}
        />
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800">
          <strong>ℹ️ Vysvětlivky:</strong>
        </p>
        <ul className="text-xs text-amber-700 mt-2 space-y-1">
          <li>• <strong>LAeq</strong> = Ekvivalentní hladina hluku A (energetický průměr)</li>
          <li>• <strong>L5</strong> = 5% času je hluk VYŠŠÍ (špičky)</li>
          <li>• <strong>L10</strong> = 10% času je hluk VYŠŠÍ</li>
          <li>• <strong>L50</strong> = 50% času je hluk VYŠŠÍ (medián)</li>
          <li>• <strong>L90</strong> = 90% času je hluk VYŠŠÍ (pozadí)</li>
          <li>• <strong>L95</strong> = 95% času je hluk VYŠŠÍ (minimum)</li>
          <li>• <strong className="text-orange-600">Oranžové pozadí</strong> = Zdroj hluku</li>
          <li>• <strong className="text-blue-600">Modré pozadí</strong> = Hluk pozadí</li>
        </ul>
      </div>
    </div>
  );
}
