'use client';

import { StationarySource } from '@/types/stationary';
import { formatNumber } from '@/lib/format';
import { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';

interface StationaryCalculationsProps {
  sources: StationarySource[];
  allSources: StationarySource[];
  reflectionCorrections: Map<string, boolean>;
  onReflectionCorrectionsChange: (corrections: Map<string, boolean>) => void;
}

export function StationaryCalculations({ sources, allSources, reflectionCorrections, onReflectionCorrectionsChange }: StationaryCalculationsProps) {

  // Find background for each source
  const getBackgroundForSource = (source: StationarySource) => {
    if (source.type === 'background') return null;
    return allSources.find(s => s.type === 'background') || null;
  };

  // Calculate logarithmic subtraction (korekce na zbytkový hluk)
  const calculateBackgroundCorrection = (sourceLevel: number, backgroundLevel: number): number => {
    const difference = sourceLevel - backgroundLevel;

    if (difference < 3) {
      return 0; // Cannot correct
    } else if (difference >= 3 && difference < 10) {
      // Apply correction using formula: L_corrected = 10 * log10(10^(L_source/10) - 10^(L_background/10))
      const sourcePower = Math.pow(10, sourceLevel / 10);
      const backgroundPower = Math.pow(10, backgroundLevel / 10);
      const correctedPower = sourcePower - backgroundPower;

      if (correctedPower <= 0) return 0;

      const correctedLevel = 10 * Math.log10(correctedPower);
      return correctedLevel - sourceLevel; // Return the correction value (negative, it's a subtraction)
    } else {
      return 0; // No correction needed
    }
  };

  // Get correction status message
  const getCorrectionStatus = (sourceLevel: number, backgroundLevel: number): string => {
    const difference = sourceLevel - backgroundLevel;

    if (difference < 3) {
      return 'Naměřený zdroj hluku nebylo možné jednoznačně odlišit od zbytkového hluku';
    } else if (difference >= 3 && difference < 10) {
      return 'Naměřené hodnoty budou dále korigovány na zbytkový hluk';
    } else {
      return 'Nekoriguje se';
    }
  };

  // Check if any source has tonal components
  const hasTonalComponents = (source: StationarySource): boolean => {
    return source.tonalComponents?.some(tc => tc) || false;
  };

  const handleExportToExcel = () => {
    const wb = XLSX.utils.book_new();

    // Prepare data for all sources
    const data: any[] = [];

    // Header
    data.push(['Výpočet akustických parametrů stacionárních zdrojů']);
    data.push(['']);

    // Basic data table for all sources
    data.push(['Základní údaje']);
    data.push(['', 'Čas měření', 'LAeq (dB)', 'L5 (dB)', 'L10 (dB)', 'L90 (dB)', 'L95 (dB)']);

    sources.forEach(source => {
      const startTime = `${source.startTime.getHours().toString().padStart(2, '0')}:${source.startTime.getMinutes().toString().padStart(2, '0')}:${source.startTime.getSeconds().toString().padStart(2, '0')}`;
      const endTime = `${source.endTime.getHours().toString().padStart(2, '0')}:${source.endTime.getMinutes().toString().padStart(2, '0')}:${source.endTime.getSeconds().toString().padStart(2, '0')}`;

      data.push([
        source.name || (source.type === 'background' ? 'Hluk pozadí' : 'Zdroj'),
        `${startTime} - ${endTime}`,
        formatNumber(source.laeq),
        formatNumber(source.l5),
        formatNumber(source.l10),
        formatNumber(source.l90),
        formatNumber(source.l95),
      ]);
    });

    data.push(['']);

    // For each source (not background), add calculations
    sources.filter(s => s.type === 'source').forEach(source => {
      const background = getBackgroundForSource(source);

      data.push(['']);
      data.push([`Výpočet pro: ${source.name || 'Zdroj hluku'}`]);
      data.push(['']);

      if (background) {
        const difference = source.laeq - background.laeq;
        const status = getCorrectionStatus(source.laeq, background.laeq);

        data.push(['Rozdíl mezi zdrojem a pozadím:', formatNumber(difference) + ' dB']);
        data.push(['Postup:', status]);
        data.push(['']);

        // Tonal component info
        if (hasTonalComponents(source)) {
          data.push(['Výskyt tónové složky:', 'ANO']);
        } else {
          data.push(['Výskyt tónové složky:', 'NE']);
        }
        data.push(['']);

        // Correction table
        data.push(['Korekce']);
        data.push(['', 'Hodnota (dB)']);
        data.push(['naměřená hodnota LAeq - nekorigovaná na zbytkový hluk', formatNumber(source.laeq)]);

        const bgCorrection = calculateBackgroundCorrection(source.laeq, background.laeq);
        data.push(['korekce na zbytkový hluk', formatNumber(bgCorrection)]);

        const reflectionCorrection = reflectionCorrections.get(source.id) ? -2.0 : 0.0;
        data.push(['korekce na vliv odrazivé plochy', formatNumber(reflectionCorrection)]);

        const finalLevel = source.laeq + bgCorrection + reflectionCorrection;
        data.push(['výsledná dopadající hladina LAeq,T pro dobu provozu zdroje hluku', formatNumber(finalLevel)]);
      } else {
        data.push(['Hluk pozadí nebyl definován']);
      }
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Dopočet');

    const filename = `stacionarni_dopocet_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="space-y-6">
      {/* Export button */}
      <div className="flex justify-end">
        <button
          onClick={handleExportToExcel}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          📊 Exportovat do Excelu
        </button>
      </div>

      {/* Basic data table */}
      <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3">
          <h3 className="text-lg font-semibold">Základní údaje</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 tracking-wider">
                  Název
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 tracking-wider">
                  Čas měření
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 tracking-wider">
                  LAeq (dB)
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 tracking-wider">
                  L5 (dB)
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 tracking-wider">
                  L10 (dB)
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 tracking-wider">
                  L90 (dB)
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 tracking-wider">
                  L95 (dB)
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sources.map((source) => {
                const startTime = `${source.startTime.getHours().toString().padStart(2, '0')}:${source.startTime.getMinutes().toString().padStart(2, '0')}:${source.startTime.getSeconds().toString().padStart(2, '0')}`;
                const endTime = `${source.endTime.getHours().toString().padStart(2, '0')}:${source.endTime.getMinutes().toString().padStart(2, '0')}:${source.endTime.getSeconds().toString().padStart(2, '0')}`;

                return (
                  <tr key={source.id} className={source.type === 'background' ? 'bg-green-50' : 'bg-blue-50'}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {source.name || (source.type === 'background' ? 'Hluk pozadí' : 'Zdroj')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {startTime} - {endTime}
                    </td>
                    <td className="px-6 py-4 text-sm text-center text-gray-900 font-medium">
                      {formatNumber(source.laeq)}
                    </td>
                    <td className="px-6 py-4 text-sm text-center text-gray-700">
                      {formatNumber(source.l5)}
                    </td>
                    <td className="px-6 py-4 text-sm text-center text-gray-700">
                      {formatNumber(source.l10)}
                    </td>
                    <td className="px-6 py-4 text-sm text-center text-gray-700">
                      {formatNumber(source.l90)}
                    </td>
                    <td className="px-6 py-4 text-sm text-center text-gray-700">
                      {formatNumber(source.l95)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Correction calculations for each source */}
      {sources.filter(s => s.type === 'source').map((source) => {
        const background = getBackgroundForSource(source);

        if (!background) {
          return (
            <div key={source.id} className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                {source.name || 'Zdroj hluku'}
              </h3>
              <p className="text-yellow-700">
                Hluk pozadí nebyl definován. Nelze provést výpočet korekcí.
              </p>
            </div>
          );
        }

        const difference = source.laeq - background.laeq;
        const status = getCorrectionStatus(source.laeq, background.laeq);
        const bgCorrection = calculateBackgroundCorrection(source.laeq, background.laeq);
        const reflectionCorrection = reflectionCorrections.get(source.id) ? -2.0 : 0.0;
        const finalLevel = source.laeq + bgCorrection + reflectionCorrection;
        const hasTonal = hasTonalComponents(source);

        return (
          <div key={source.id} className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3">
              <h3 className="text-lg font-semibold">{source.name || 'Zdroj hluku'}</h3>
            </div>

            <div className="p-6 space-y-6">
              {/* Status info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Rozdíl LAeq (zdroj - pozadí):</span>
                  <span className="text-lg font-bold text-gray-900">{formatNumber(difference)} dB</span>
                </div>
                <div className={`text-sm font-medium p-3 rounded ${
                  difference < 3 ? 'bg-red-100 text-red-800' :
                  difference < 10 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {status}
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="text-sm font-medium text-gray-700">Tónová složka:</span>
                  <span className={`text-sm font-bold ${hasTonal ? 'text-red-600' : 'text-green-600'}`}>
                    {hasTonal ? 'ANO' : 'NE'}
                  </span>
                </div>
              </div>

              {/* Correction table */}
              <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        Parametr
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                        Hodnota (dB)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        naměřená hodnota L<sub>Aeq</sub> - nekorigovaná na zbytkový hluk
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-medium text-gray-900">
                        {formatNumber(source.laeq)}
                      </td>
                    </tr>
                    <tr className={bgCorrection !== 0 ? 'bg-yellow-50' : ''}>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        korekce na zbytkový hluk (dB)
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-medium text-gray-900">
                        {formatNumber(bgCorrection)}
                      </td>
                    </tr>
                    <tr className={reflectionCorrection !== 0 ? 'bg-blue-50' : ''}>
                      <td className="px-4 py-3 text-sm text-gray-700 flex items-center gap-3">
                        <span>korekce na vliv odrazivé plochy (dB)</span>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={reflectionCorrections.get(source.id) || false}
                            onChange={(e) => {
                              const newMap = new Map(reflectionCorrections);
                              newMap.set(source.id, e.target.checked);
                              onReflectionCorrectionsChange(newMap);
                            }}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-600">Aplikovat (-2,0 dB)</span>
                        </label>
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-medium text-gray-900">
                        {formatNumber(reflectionCorrection)}
                      </td>
                    </tr>
                    <tr className="bg-blue-100">
                      <td className="px-4 py-3 text-sm font-bold text-gray-900">
                        výsledná dopadající hladina L<sub>Aeq,T</sub> pro dobu provozu zdroje hluku
                      </td>
                      <td className="px-4 py-3 text-center text-lg font-bold text-blue-900">
                        {formatNumber(finalLevel)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
