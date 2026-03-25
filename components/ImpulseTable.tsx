'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ImpulseData } from '@/app/impulzni-hluk/page';
import * as XLSX from 'xlsx';

interface ImpulseTableProps {
  data: ImpulseData[];
}

export default function ImpulseTable({ data }: ImpulseTableProps) {
  const [sortField, setSortField] = useState<'timestamp' | 'lAImax' | 'lASmax' | 'lAeq' | 'lAeqCorrected' | 'difference'>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  if (data.length === 0) return null;

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
    } else if (sortField === 'lAeqCorrected') {
      comparison = a.lAeqCorrected - b.lAeqCorrected;
    } else if (sortField === 'difference') {
      comparison = a.difference - b.difference;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: 'timestamp' | 'lAImax' | 'lASmax' | 'lAeq' | 'lAeqCorrected' | 'difference') => {
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
      'Čas': format(d.timestamp, 'dd.MM.yyyy HH:mm:ss'),
      'LAeq [dB(A)]': d.lAeq.toFixed(1),
      'LAImax [dB(A)]': d.lAImax.toFixed(1),
      'LASmax [dB(A)]': d.lASmax.toFixed(1),
      'Rozdíl [dB]': d.difference.toFixed(1),
      'LAeq 1s před [dB(A)]': d.lAeqBefore.toFixed(1),
      'LAeq 1s po [dB(A)]': d.lAeqAfter.toFixed(1),
      'Průměr pozadí [dB(A)]': d.lAeqBackground.toFixed(1),
      'LAeq korigovaný [dB(A)]': d.lAeqCorrected.toFixed(1),
      'Den/Noc': d.isDaytime ? 'Den' : 'Noc',
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

  const SortIcon = ({ field }: { field: 'timestamp' | 'lAImax' | 'lASmax' | 'lAeq' | 'lAeqCorrected' | 'difference' }) => {
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
              <th className="text-left py-3 px-2 font-semibold text-gray-700 text-xs">
                #
              </th>
              <th
                className="text-left py-3 px-2 font-semibold text-gray-700 cursor-pointer hover:bg-gray-50 text-xs"
                onClick={() => handleSort('timestamp')}
              >
                Čas <SortIcon field="timestamp" />
              </th>
              <th
                className="text-left py-3 px-2 font-semibold text-gray-700 cursor-pointer hover:bg-gray-50 text-xs"
                onClick={() => handleSort('lAeq')}
              >
                L<sub>Aeq</sub> <SortIcon field="lAeq" />
              </th>
              <th
                className="text-left py-3 px-2 font-semibold text-gray-700 cursor-pointer hover:bg-gray-50 text-xs"
                onClick={() => handleSort('lAImax')}
              >
                L<sub>AImax</sub> <SortIcon field="lAImax" />
              </th>
              <th
                className="text-left py-3 px-2 font-semibold text-gray-700 cursor-pointer hover:bg-gray-50 text-xs"
                onClick={() => handleSort('lASmax')}
              >
                L<sub>ASmax</sub> <SortIcon field="lASmax" />
              </th>
              <th
                className="text-left py-3 px-2 font-semibold text-gray-700 cursor-pointer hover:bg-gray-50 text-xs"
                onClick={() => handleSort('difference')}
              >
                Rozdíl <SortIcon field="difference" />
              </th>
              <th className="text-left py-3 px-2 font-semibold text-gray-700 text-xs">
                L<sub>Aeq</sub> 1s před
              </th>
              <th className="text-left py-3 px-2 font-semibold text-gray-700 text-xs">
                L<sub>Aeq</sub> 1s po
              </th>
              <th className="text-left py-3 px-2 font-semibold text-gray-700 text-xs">
                Průměr pozadí
              </th>
              <th
                className="text-left py-3 px-2 font-semibold text-gray-700 cursor-pointer hover:bg-gray-50 text-xs"
                onClick={() => handleSort('lAeqCorrected')}
              >
                L<sub>Aeq</sub> korig. <SortIcon field="lAeqCorrected" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((d, index) => {
              return (
                <tr
                  key={index}
                  className={`border-b border-gray-200 hover:bg-gray-50 text-xs ${
                    d.isDaytime ? '' : 'bg-blue-50'
                  }`}
                >
                  <td className="py-2 px-2 text-gray-600">{index + 1}</td>
                  <td className="py-2 px-2 text-gray-900">
                    {format(d.timestamp, 'dd.MM.yyyy HH:mm:ss')}
                    {!d.isDaytime && <span className="ml-1 text-blue-600">🌙</span>}
                  </td>
                  <td className="py-2 px-2 text-gray-900">
                    {d.lAeq.toFixed(1)}
                  </td>
                  <td className="py-2 px-2 font-bold text-red-600">
                    {d.lAImax.toFixed(1)}
                  </td>
                  <td className="py-2 px-2 text-gray-900">
                    {d.lASmax.toFixed(1)}
                  </td>
                  <td className="py-2 px-2 font-bold text-red-600">
                    {d.difference.toFixed(1)}
                  </td>
                  <td className="py-2 px-2 text-gray-600">
                    {d.lAeqBefore.toFixed(1)}
                  </td>
                  <td className="py-2 px-2 text-gray-600">
                    {d.lAeqAfter.toFixed(1)}
                  </td>
                  <td className="py-2 px-2 text-blue-700 font-semibold">
                    {d.lAeqBackground.toFixed(1)}
                  </td>
                  <td className="py-2 px-2 font-bold text-green-700">
                    {d.lAeqCorrected.toFixed(1)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-xs text-gray-500 flex items-center justify-between">
        <span>Celkem zobrazeno: {sortedData.length} impulsů</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-white border border-gray-200 rounded"></span>
            Denní doba
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-blue-50 border border-blue-200 rounded"></span>
            Noční doba 🌙
          </span>
        </div>
      </div>
    </div>
  );
}
