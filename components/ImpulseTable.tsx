'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ImpulseData } from '@/app/impulzni-hluk/page';
import * as XLSX from 'xlsx';

interface ImpulseTableProps {
  data: ImpulseData[];
}

export default function ImpulseTable({ data }: ImpulseTableProps) {
  const [sortField, setSortField] = useState<'timestamp' | 'lAImax' | 'lASmax' | 'lAeq' | 'difference'>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  if (data.length === 0) return null;

  const hasDuration = data.some((d) => d.duration !== undefined);
  const hasSource = data.some((d) => d.source !== undefined);

  // Sort data
  const sortedData = [...data].sort((a, b) => {
    let comparison = 0;

    if (sortField === 'timestamp') {
      comparison = a.timestamp.getTime() - b.timestamp.getTime();
    } else if (sortField === 'lAImax') {
      comparison = a.lAImax - b.lAImax;
    } else if (sortField === 'lASmax') {
      comparison = a.lASmax - b.lASmax;
    } else if (sortField === 'lAeq') {
      comparison = a.lAeq - b.lAeq;
    } else if (sortField === 'difference') {
      comparison = (a.lAImax - a.lASmax) - (b.lAImax - b.lASmax);
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: 'timestamp' | 'lAImax' | 'lASmax' | 'lAeq' | 'difference') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const exportToExcel = () => {
    const exportData = sortedData.map((d, index) => ({
      'Pořadí': index + 1,
      'Datum a čas': format(d.timestamp, 'dd.MM.yyyy HH:mm:ss'),
      'LAImax [dB(A)]': d.lAImax.toFixed(1),
      'LASmax [dB(A)]': d.lASmax.toFixed(1),
      'LAeq [dB(A)]': d.lAeq.toFixed(1),
      'Rozdíl [dB]': (d.lAImax - d.lASmax).toFixed(1),
      'Vysoce impulsní': d.isHighlyImpulsive ? 'Ano' : 'Ne',
      ...(hasDuration && { 'Délka [ms]': d.duration?.toFixed(0) || '-' }),
      ...(hasSource && { 'Zdroj': d.source || '-' }),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Impulzní hluk');

    // Auto-size columns
    const maxWidth = 20;
    const colWidths = Object.keys(exportData[0] || {}).map((key) => ({
      wch: Math.min(
        maxWidth,
        Math.max(
          key.length,
          ...exportData.map((row: any) => String(row[key] || '').length)
        )
      ),
    }));
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, `impulzni_hluk_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.xlsx`);
  };

  const SortIcon = ({ field }: { field: 'timestamp' | 'lAImax' | 'lASmax' | 'lAeq' | 'difference' }) => {
    if (sortField !== field) {
      return <span className="text-gray-400">↕️</span>;
    }
    return sortDirection === 'asc' ? <span>↑</span> : <span>↓</span>;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">📋 Tabulka událostí</h2>
        <button
          onClick={exportToExcel}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          📥 Export do Excelu
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                #
              </th>
              <th
                className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('timestamp')}
              >
                Datum a čas <SortIcon field="timestamp" />
              </th>
              <th
                className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('lAImax')}
              >
                L<sub>AImax</sub> [dB(A)] <SortIcon field="lAImax" />
              </th>
              <th
                className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('lASmax')}
              >
                L<sub>ASmax</sub> [dB(A)] <SortIcon field="lASmax" />
              </th>
              <th
                className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('lAeq')}
              >
                L<sub>Aeq</sub> [dB(A)] <SortIcon field="lAeq" />
              </th>
              <th
                className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('difference')}
              >
                Rozdíl [dB] <SortIcon field="difference" />
              </th>
              {hasDuration && (
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Délka [ms]
                </th>
              )}
              {hasSource && (
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Zdroj
                </th>
              )}
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Hodnocení
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((d, index) => {
              const difference = d.lAImax - d.lASmax;
              const isHighlyImpulsive = d.isHighlyImpulsive;

              return (
                <tr
                  key={index}
                  className={`border-b border-gray-200 hover:bg-gray-50 ${
                    isHighlyImpulsive ? 'bg-red-50' : ''
                  }`}
                >
                  <td className="py-3 px-4 text-gray-600">{index + 1}</td>
                  <td className="py-3 px-4 text-gray-900">
                    {format(d.timestamp, 'dd.MM.yyyy HH:mm:ss')}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`font-bold ${isHighlyImpulsive ? 'text-red-600' : 'text-gray-900'}`}>
                      {d.lAImax.toFixed(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-900">
                    {d.lASmax.toFixed(1)}
                  </td>
                  <td className="py-3 px-4 text-gray-900">
                    {d.lAeq.toFixed(1)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`font-bold ${isHighlyImpulsive ? 'text-red-600' : 'text-gray-900'}`}>
                      {difference.toFixed(1)}
                    </span>
                  </td>
                  {hasDuration && (
                    <td className="py-3 px-4 text-gray-900">
                      {d.duration !== undefined ? d.duration.toFixed(0) : '-'}
                    </td>
                  )}
                  {hasSource && (
                    <td className="py-3 px-4 text-gray-700">
                      {d.source || '-'}
                    </td>
                  )}
                  <td className="py-3 px-4">
                    {isHighlyImpulsive ? (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                        💥 Vysoce impulsní
                      </span>
                    ) : (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        ✅ Impulsní
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        Celkem zobrazeno: {sortedData.length} událostí
      </div>
    </div>
  );
}
