'use client';

import { useState, useMemo } from 'react';
import { HourlyTrafficCount, TrafficSummary, GroupedTrafficSummary } from '@/types/traffic';
import { calculateTrafficSummary, calculateGroupedSummary, calculateTP189GroupedSummary, initializeHourlyCounts } from '@/lib/trafficCalculations';
import { parseTrafficExcel } from '@/lib/trafficParser';
import { formatNumber } from '@/lib/format';
import { calculateRPDI, validateRPDIInput, RPDIInput, RPDIResult } from '@/lib/rpdiCalculator';
import { RoadType } from '@/lib/tp189coefficients';

interface TrafficCountingProps {
  hourlyCounts?: HourlyTrafficCount[];
  onHourlyCountsChange?: (data: HourlyTrafficCount[]) => void;
  countingDate?: string;
  onCountingDateChange?: (date: string) => void;
  roadType?: RoadType;
  onRoadTypeChange?: (roadType: RoadType) => void;
  onDataChange?: (data: HourlyTrafficCount[]) => void;
}

export function TrafficCounting({
  hourlyCounts: externalHourlyCounts,
  onHourlyCountsChange,
  countingDate: externalCountingDate,
  onCountingDateChange,
  roadType: externalRoadType,
  onRoadTypeChange,
  onDataChange
}: TrafficCountingProps) {
  // Použij external state pokud je poskytnut, jinak internal state
  const [internalHourlyCounts, setInternalHourlyCounts] = useState<HourlyTrafficCount[]>(initializeHourlyCounts());
  const [internalCountingDate, setInternalCountingDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [internalRoadType, setInternalRoadType] = useState<RoadType>('I');
  const [showRPDI, setShowRPDI] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  const hourlyCounts = externalHourlyCounts ?? internalHourlyCounts;
  const countingDate = externalCountingDate ?? internalCountingDate;
  const roadType = externalRoadType ?? internalRoadType;

  const setHourlyCounts = (data: HourlyTrafficCount[] | ((prev: HourlyTrafficCount[]) => HourlyTrafficCount[])) => {
    const newData = typeof data === 'function' ? data(hourlyCounts) : data;
    if (onHourlyCountsChange) {
      onHourlyCountsChange(newData);
    } else {
      setInternalHourlyCounts(newData);
    }
  };

  const setCountingDate = (date: string) => {
    if (onCountingDateChange) {
      onCountingDateChange(date);
    } else {
      setInternalCountingDate(date);
    }
  };

  const setRoadType = (type: RoadType) => {
    if (onRoadTypeChange) {
      onRoadTypeChange(type);
    } else {
      setInternalRoadType(type);
    }
  };

  const summary = useMemo(() => calculateTrafficSummary(hourlyCounts), [hourlyCounts]);
  const grouped = useMemo(() => calculateGroupedSummary(summary), [summary]);

  // Výpočet RPDI
  const rpdiResult = useMemo<RPDIResult | null>(() => {
    if (!showRPDI) return null;

    try {
      const input: RPDIInput = {
        countingDate: new Date(countingDate),
        roadType,
        hourlyCounts: {
          OA: hourlyCounts.map(h => h.OA),
          LN: hourlyCounts.map(h => h.LN),
          N: hourlyCounts.map(h => h.N),
          A: hourlyCounts.map(h => h.A),
          M: hourlyCounts.map(h => h.M),
          K: hourlyCounts.map(h => h.K),
        },
      };

      const validation = validateRPDIInput(input);
      if (!validation.valid) {
        console.error('RPDI validation errors:', validation.errors);
        return null;
      }

      return calculateRPDI(input);
    } catch (error) {
      console.error('RPDI calculation error:', error);
      return null;
    }
  }, [hourlyCounts, countingDate, roadType, showRPDI]);

  const tp189Grouped = useMemo(() => calculateTP189GroupedSummary(rpdiResult), [rpdiResult]);

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

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    // Check file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];

    if (!validTypes.includes(file.type) &&
        !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      alert('Neplatný formát souboru. Použij .xlsx, .xls nebo .csv');
      return;
    }

    try {
      const data = await parseTrafficExcel(file);
      setHourlyCounts(data);
      onDataChange?.(data);
    } catch (error) {
      alert((error as Error).message);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  return (
    <div className="space-y-6">
      {/* Upload Section with Drag & Drop */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`bg-blue-50 border-2 border-dashed rounded-lg p-6 transition-all ${
          isDragActive
            ? 'border-blue-500 bg-blue-100 scale-[1.02]'
            : 'border-blue-200'
        }`}
      >
        <h3 className="text-sm font-medium text-blue-900 mb-2">📤 Import dat z Excelu</h3>
        <p className="text-xs text-blue-700 mb-4">
          Formát: Hodina (0-23), OA, LN, N, A, M, K
        </p>

        {isDragActive ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📥</div>
            <p className="text-sm font-medium text-blue-900">Pusť soubor zde</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-center py-4 border-2 border-dashed border-blue-300 rounded-lg bg-white">
              <div className="text-3xl mb-2">📁</div>
              <p className="text-sm text-gray-600 mb-1">Přetáhni soubor sem</p>
              <p className="text-xs text-gray-500">nebo</p>
            </div>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-900 border border-blue-300 rounded-lg cursor-pointer bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
            />
          </div>
        )}
      </div>

      {/* RPDI Settings Section */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-medium text-green-900">🧮 Výpočet RPDI podle TP 189</h3>
            <p className="text-xs text-green-700 mt-1">
              Roční průměrná denní intenzita dopravy
            </p>
          </div>
          <button
            onClick={() => setShowRPDI(!showRPDI)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              showRPDI
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-white text-green-900 border border-green-300 hover:bg-green-100'
            }`}
          >
            {showRPDI ? '✓ Zobrazeno' : 'Vypočítat RPDI'}
          </button>
        </div>

        {showRPDI && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t border-green-300">
            <div>
              <label className="block text-xs font-medium text-green-900 mb-1">
                Datum sčítání
              </label>
              <input
                type="date"
                value={countingDate}
                onChange={(e) => setCountingDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-green-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-green-900 mb-1">
                Typ komunikace
              </label>
              <select
                value={roadType}
                onChange={(e) => setRoadType(e.target.value as RoadType)}
                className="w-full px-3 py-2 text-sm border border-green-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="D-I">Dálnice D-I (nejvýznamnější)</option>
                <option value="D-II">Dálnice D-II (méně vytížená)</option>
                <option value="E">Silnice evropského významu (E)</option>
                <option value="I">Silnice I. třídy</option>
                <option value="II-H">Silnice II. třídy - hlavní charakter</option>
                <option value="II-S">Silnice II. třídy - sídelní charakter</option>
                <option value="II-R-L">Silnice II. třídy - rekreační letní</option>
                <option value="II-R-Z">Silnice II. třídy - rekreační zimní</option>
                <option value="M">Místní komunikace</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* RPDI Results */}
      {showRPDI && rpdiResult && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-green-600 text-white">
            <h3 className="text-lg font-bold">📊 Výsledky RPDI - {rpdiResult.metadata.roadType}</h3>
            <p className="text-sm text-green-100 mt-1">
              {rpdiResult.metadata.dayOfWeek}, {rpdiResult.metadata.countingDate.toLocaleDateString('cs-CZ')} • {rpdiResult.metadata.season} období
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Celkové RPDI - 3 karty */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Celkem 24h */}
              <div className="bg-white rounded-lg border-2 border-green-500 p-4 shadow-md">
                <div className="text-center">
                  <div className="text-xs font-medium text-gray-600 mb-1">CELKEM 24h</div>
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {formatNumber(rpdiResult.total.total.RPDI, 0)}
                  </div>
                  <div className="text-xs text-gray-500">voz/den RPDI</div>
                  <div className="text-xs text-gray-400 mt-2">
                    Naměřeno: {formatNumber(rpdiResult.total.total.measuredDaily, 0)}
                  </div>
                </div>
              </div>

              {/* Den */}
              <div className="bg-white rounded-lg border-2 border-yellow-400 p-4 shadow-md">
                <div className="text-center">
                  <div className="text-xs font-medium text-gray-600 mb-1">☀️ DEN (6:00-22:00)</div>
                  <div className="text-3xl font-bold text-yellow-600 mb-1">
                    {formatNumber(rpdiResult.total.day.RPDI, 0)}
                  </div>
                  <div className="text-xs text-gray-500">voz/den RPDI</div>
                  <div className="text-xs text-gray-400 mt-2">
                    Naměřeno: {formatNumber(rpdiResult.total.day.measuredDaily, 0)}
                  </div>
                </div>
              </div>

              {/* Noc */}
              <div className="bg-white rounded-lg border-2 border-blue-400 p-4 shadow-md">
                <div className="text-center">
                  <div className="text-xs font-medium text-gray-600 mb-1">🌙 NOC (22:00-6:00)</div>
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {formatNumber(rpdiResult.total.night.RPDI, 0)}
                  </div>
                  <div className="text-xs text-gray-500">voz/den RPDI</div>
                  <div className="text-xs text-gray-400 mt-2">
                    Naměřeno: {formatNumber(rpdiResult.total.night.measuredDaily, 0)}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabulka podle kategorií - CELKEM 24h */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-green-100 border-b border-green-200">
                <h4 className="text-sm font-bold text-green-900">CELKEM 24 HODIN</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Kategorie</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Naměřeno</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Týdenní<br/>průměr</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase bg-green-100">RPDI</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">k<sub>d,t</sub></th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">k<sub>t,RPDI</sub></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(['OA', 'LN', 'N', 'A', 'M', 'K'] as const).map((category) => {
                      const result = rpdiResult.categories[category].total;
                      const names: Record<string, string> = {
                        OA: '🚗 Osobní automobily',
                        LN: '🚐 Lehká užitková',
                        N: '🚚 Nákladní',
                        A: '🚌 Autobusy',
                        M: '🏍️ Motocykly',
                        K: '🚛 Kamiony',
                      };
                      return (
                        <tr key={category} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{names[category]}</td>
                          <td className="px-4 py-3 text-center text-sm text-gray-900">{formatNumber(result.measuredDaily, 0)}</td>
                          <td className="px-4 py-3 text-center text-sm text-gray-900">{formatNumber(Math.round(result.weeklyAverage), 0)}</td>
                          <td className="px-4 py-3 text-center text-sm font-bold text-green-600 bg-green-50">{formatNumber(result.RPDI, 0)}</td>
                          <td className="px-4 py-3 text-center text-xs text-gray-600">{result.usedCoefficients.dayToWeek.toFixed(3)}</td>
                          <td className="px-4 py-3 text-center text-xs text-gray-600">{result.usedCoefficients.weekToYear.toFixed(3)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tabulka podle kategorií - DEN */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-yellow-100 border-b border-yellow-200">
                <h4 className="text-sm font-bold text-yellow-900">☀️ DEN (6:00-22:00)</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Kategorie</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Naměřeno</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Týdenní<br/>průměr</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase bg-yellow-100">RPDI</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">k<sub>d,t</sub></th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">k<sub>t,RPDI</sub></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(['OA', 'LN', 'N', 'A', 'M', 'K'] as const).map((category) => {
                      const result = rpdiResult.categories[category].day;
                      const names: Record<string, string> = {
                        OA: '🚗 Osobní automobily',
                        LN: '🚐 Lehká užitková',
                        N: '🚚 Nákladní',
                        A: '🚌 Autobusy',
                        M: '🏍️ Motocykly',
                        K: '🚛 Kamiony',
                      };
                      return (
                        <tr key={category} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{names[category]}</td>
                          <td className="px-4 py-3 text-center text-sm text-gray-900">{formatNumber(result.measuredDaily, 0)}</td>
                          <td className="px-4 py-3 text-center text-sm text-gray-900">{formatNumber(Math.round(result.weeklyAverage), 0)}</td>
                          <td className="px-4 py-3 text-center text-sm font-bold text-yellow-600 bg-yellow-50">{formatNumber(result.RPDI, 0)}</td>
                          <td className="px-4 py-3 text-center text-xs text-gray-600">{result.usedCoefficients.dayToWeek.toFixed(3)}</td>
                          <td className="px-4 py-3 text-center text-xs text-gray-600">{result.usedCoefficients.weekToYear.toFixed(3)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tabulka podle kategorií - NOC */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-blue-100 border-b border-blue-200">
                <h4 className="text-sm font-bold text-blue-900">🌙 NOC (22:00-6:00)</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Kategorie</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Naměřeno</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Týdenní<br/>průměr</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase bg-blue-100">RPDI</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">k<sub>d,t</sub></th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">k<sub>t,RPDI</sub></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(['OA', 'LN', 'N', 'A', 'M', 'K'] as const).map((category) => {
                      const result = rpdiResult.categories[category].night;
                      const names: Record<string, string> = {
                        OA: '🚗 Osobní automobily',
                        LN: '🚐 Lehká užitková',
                        N: '🚚 Nákladní',
                        A: '🚌 Autobusy',
                        M: '🏍️ Motocykly',
                        K: '🚛 Kamiony',
                      };
                      return (
                        <tr key={category} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{names[category]}</td>
                          <td className="px-4 py-3 text-center text-sm text-gray-900">{formatNumber(result.measuredDaily, 0)}</td>
                          <td className="px-4 py-3 text-center text-sm text-gray-900">{formatNumber(Math.round(result.weeklyAverage), 0)}</td>
                          <td className="px-4 py-3 text-center text-sm font-bold text-blue-600 bg-blue-50">{formatNumber(result.RPDI, 0)}</td>
                          <td className="px-4 py-3 text-center text-xs text-gray-600">{result.usedCoefficients.dayToWeek.toFixed(3)}</td>
                          <td className="px-4 py-3 text-center text-xs text-gray-600">{result.usedCoefficients.weekToYear.toFixed(3)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Info box */}
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <span className="text-blue-600 text-lg">ℹ️</span>
                <div className="text-xs text-blue-900">
                  <p className="font-medium mb-1">Použitý vzorec: RPDI = Im × k<sub>d,t</sub> × k<sub>t,RPDI</sub></p>
                  <p className="text-blue-700">
                    <strong>k<sub>d,t</sub></strong> = koeficient z denní intenzity na týdenní průměr (zohledňuje den v týdnu)<br/>
                    <strong>k<sub>t,RPDI</sub></strong> = koeficient z týdenního průměru na roční průměr (zohledňuje období roku)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Summary Table with RPDI */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Součty podle období {showRPDI && rpdiResult && '+ RPDI'}</h3>
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
              <SummaryRow label="☀️ Den (6:00-22:00)" counts={summary.day} bgColor="bg-yellow-50" />
              {showRPDI && rpdiResult && (
                <SummaryRPDIRow label="☀️ Den - RPDI" rpdiData={rpdiResult.categories} period="day" bgColor="bg-yellow-100" />
              )}
              <SummaryRow label="🌙 Noc (22:00-6:00)" counts={summary.night} bgColor="bg-blue-50" />
              {showRPDI && rpdiResult && (
                <SummaryRPDIRow label="🌙 Noc - RPDI" rpdiData={rpdiResult.categories} period="night" bgColor="bg-blue-100" />
              )}
              <SummaryRow label="🌍 Celkem 24h" counts={summary.total} bgColor="bg-green-50" />
              {showRPDI && rpdiResult && (
                <SummaryRPDIRow label="🌍 Celkem - RPDI" rpdiData={rpdiResult.categories} period="total" bgColor="bg-green-100" />
              )}
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

      {/* TP 189 Grouped Summary Table */}
      {showRPDI && rpdiResult && (
        <div className="bg-white rounded-lg shadow-sm border border-green-300 overflow-hidden">
          <div className="px-6 py-4 bg-green-50 border-b border-green-200">
            <h3 className="text-lg font-semibold text-green-900">Seskupené kategorie dle TP 189 (nově vypočtené)</h3>
            <p className="text-xs text-green-700 mt-1">
              Kategorie 1: OA + LN + M • Kategorie 2: A + N • Kategorie 3: K (z RPDI hodnot)
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
                <GroupedRow label="Den (6:00-22:00)" counts={tp189Grouped.day} bgColor="bg-yellow-50" />
                <GroupedRow label="Noc (22:00-6:00)" counts={tp189Grouped.night} bgColor="bg-blue-50" />
                <GroupedRow label="Celkem 24h" counts={tp189Grouped.total} bgColor="bg-green-50" />
              </tbody>
            </table>
          </div>
        </div>
      )}
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

function SummaryRPDIRow({
  label,
  rpdiData,
  period,
  bgColor
}: {
  label: string;
  rpdiData: any;
  period: 'total' | 'day' | 'night';
  bgColor: string;
}) {
  return (
    <tr className={bgColor}>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
        {label}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-gray-900">
        {formatNumber(rpdiData.OA[period].RPDI, 0)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-gray-900">
        {formatNumber(rpdiData.LN[period].RPDI, 0)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-gray-900">
        {formatNumber(rpdiData.N[period].RPDI, 0)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-gray-900">
        {formatNumber(rpdiData.A[period].RPDI, 0)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-gray-900">
        {formatNumber(rpdiData.M[period].RPDI, 0)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-gray-900">
        {formatNumber(rpdiData.K[period].RPDI, 0)}
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
