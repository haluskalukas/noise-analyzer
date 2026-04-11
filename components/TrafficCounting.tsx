'use client';

import { useState, useMemo } from 'react';
import { HourlyTrafficCount, TrafficSummary, GroupedTrafficSummary } from '@/types/traffic';
import { calculateTrafficSummary, calculateGroupedSummary, initializeHourlyCounts } from '@/lib/trafficCalculations';
import { parseTrafficExcel } from '@/lib/trafficParser';
import { formatNumber } from '@/lib/format';

interface TrafficCountingProps {
  onDataChange?: (data: HourlyTrafficCount[]) => void;
}

export function TrafficCounting({ onDataChange }: TrafficCountingProps) {
  const [hourlyCounts, setHourlyCounts] = useState<HourlyTrafficCount[]>(initializeHourlyCounts());

  const summary = useMemo(() => calculateTrafficSummary(hourlyCounts), [hourlyCounts]);
  const grouped = useMemo(() => calculateGroupedSummary(summary), [summary]);

  const handleCellChange = (hour: number, category: keyof Omit<HourlyTrafficCount, 'hour'>, value: string) => {
    const numValue = parseInt(value) || 0;
    setHourlyCounts(prev => {
      const updated = prev.map(h =>
        h.hour === hour ? { ...h, [category]: numValue } : h
      );
      onDataChange?.(updated);
      return updated;
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseTrafficExcel(file);
      setHourlyCounts(data);
      onDataChange?.(data);
    } catch (error) {
      alert((error as Error).message);
    }

    event.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">📤 Import dat z Excelu</h3>
        <p className="text-xs text-blue-700 mb-3">
          Formát: Hodina (0-23), OA, LN, N, A, M, K
        </p>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-900 border border-blue-300 rounded-lg cursor-pointer bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
        />
      </div>

      {/* Hourly Counts Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Hodinové hodnoty</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Hodina
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  OA
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  LN
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  N
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  A
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  M
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  K
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {hourlyCounts.map(({ hour, OA, LN, N, A, M, K }) => {
                const isDay = hour >= 6 && hour < 22;
                return (
                  <tr key={hour} className={isDay ? 'bg-yellow-50' : 'bg-blue-50'}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      {hour}:00 - {hour}:59
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="0"
                        value={OA}
                        onChange={(e) => handleCellChange(hour, 'OA', e.target.value)}
                        className="w-full px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="0"
                        value={LN}
                        onChange={(e) => handleCellChange(hour, 'LN', e.target.value)}
                        className="w-full px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="0"
                        value={N}
                        onChange={(e) => handleCellChange(hour, 'N', e.target.value)}
                        className="w-full px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="0"
                        value={A}
                        onChange={(e) => handleCellChange(hour, 'A', e.target.value)}
                        className="w-full px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="0"
                        value={M}
                        onChange={(e) => handleCellChange(hour, 'M', e.target.value)}
                        className="w-full px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="0"
                        value={K}
                        onChange={(e) => handleCellChange(hour, 'K', e.target.value)}
                        className="w-full px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Součty podle období</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Období
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  OA
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  LN
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  N
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  A
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  M
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  K
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <SummaryRow label="Den (6:00-22:00)" counts={summary.day} bgColor="bg-yellow-50" />
              <SummaryRow label="Noc (22:00-6:00)" counts={summary.night} bgColor="bg-blue-50" />
              <SummaryRow label="Celkem 24h" counts={summary.total} bgColor="bg-green-50" />
            </tbody>
          </table>
        </div>
      </div>

      {/* Grouped Summary Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Seskupené kategorie</h3>
          <p className="text-xs text-gray-600 mt-1">
            Kategorie 1: OA + LN + M • Kategorie 2: A + N • Kategorie 3: K
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Období
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Kategorie 1<br/><span className="text-xs font-normal">(OA+LN+M)</span>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Kategorie 2<br/><span className="text-xs font-normal">(A+N)</span>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Kategorie 3<br/><span className="text-xs font-normal">(K)</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <GroupedRow label="Den (6:00-22:00)" counts={grouped.day} bgColor="bg-yellow-50" />
              <GroupedRow label="Noc (22:00-6:00)" counts={grouped.night} bgColor="bg-blue-50" />
              <GroupedRow label="Celkem 24h" counts={grouped.total} bgColor="bg-green-50" />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, counts, bgColor }: { label: string; counts: any; bgColor: string }) {
  return (
    <tr className={bgColor}>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {label}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
        {formatNumber(counts.OA, 0)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
        {formatNumber(counts.LN, 0)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
        {formatNumber(counts.N, 0)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
        {formatNumber(counts.A, 0)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
        {formatNumber(counts.M, 0)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
        {formatNumber(counts.K, 0)}
      </td>
    </tr>
  );
}

function GroupedRow({ label, counts, bgColor }: { label: string; counts: any; bgColor: string }) {
  return (
    <tr className={bgColor}>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {label}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
        {formatNumber(counts.category1, 0)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
        {formatNumber(counts.category2, 0)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
        {formatNumber(counts.category3, 0)}
      </td>
    </tr>
  );
}
