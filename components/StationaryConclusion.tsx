'use client';

import { StationarySource } from '@/types/stationary';
import { formatNumber } from '@/lib/format';
import { useMemo } from 'react';
import * as XLSX from 'xlsx';

interface StationaryConclusionProps {
  sources: StationarySource[];
  allSources: StationarySource[];
  reflectionCorrections: Map<string, boolean>;
}

export function StationaryConclusion({ sources, allSources, reflectionCorrections }: StationaryConclusionProps) {
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
      const sourcePower = Math.pow(10, sourceLevel / 10);
      const backgroundPower = Math.pow(10, backgroundLevel / 10);
      const correctedPower = sourcePower - backgroundPower;

      if (correctedPower <= 0) return 0;

      const correctedLevel = 10 * Math.log10(correctedPower);
      return correctedLevel - sourceLevel; // Return the correction value (negative)
    } else {
      return 0; // No correction needed
    }
  };

  // Check if any source has tonal components
  const hasTonalComponents = (source: StationarySource): boolean => {
    return source.tonalComponents?.some(tc => tc) || false;
  };

  // Calculate final level for each source
  const calculateFinalLevel = (source: StationarySource): { finalLevel: number, uncertainty: number, hasTonal: boolean, backgroundCorrected: boolean } => {
    const background = getBackgroundForSource(source);
    if (!background) {
      return { finalLevel: source.laeq, uncertainty: 1.7, hasTonal: false, backgroundCorrected: false };
    }

    const bgCorrection = calculateBackgroundCorrection(source.laeq, background.laeq);
    const reflectionCorrection = reflectionCorrections.get(source.id) ? -2.0 : 0.0;
    const finalLevel = source.laeq + bgCorrection + reflectionCorrection;

    // Uncertainty: 1.8 dB if background was corrected, 1.7 dB otherwise
    const uncertainty = bgCorrection !== 0 ? 1.8 : 1.7;
    const hasTonal = hasTonalComponents(source);

    return { finalLevel, uncertainty, hasTonal, backgroundCorrected: bgCorrection !== 0 };
  };

  const sourcesWithCalcs = useMemo(() => {
    return sources.filter(s => s.type === 'source').map(source => {
      const calc = calculateFinalLevel(source);
      return {
        source,
        ...calc,
        // Final value with uncertainty SUBTRACTED (not added)
        finalWithUncertainty: calc.finalLevel - calc.uncertainty,
      };
    });
  }, [sources, reflectionCorrections]);

  const handleExportToExcel = () => {
    const wb = XLSX.utils.book_new();
    const data: any[] = [];

    data.push(['Závěr - Hodnocení hygienických limitů']);
    data.push(['']);

    sourcesWithCalcs.forEach((item, index) => {
      const { source, finalLevel, uncertainty, hasTonal, finalWithUncertainty } = item;
      const dayLimit = hasTonal ? 45 : 50;
      const nightLimit = hasTonal ? 35 : 40;

      if (index > 0) data.push(['']);

      data.push([`Zdroj: ${source.name || 'Zdroj hluku'}`]);
      data.push(['']);

      // Day table
      data.push(['DENNÍ DOBA']);
      data.push(['druh chráněného prostoru', 'OBVYKLPS (oblast s vyšší potřebou klidu a pohody, smíšená)']);
      data.push(['', 'stanovený hygienický limit']);
      data.push(['denní doba', dayLimit.toFixed(1)]);
      data.push(['']);
      data.push(['výsledná dopadající hladina při převodu legalního čerpání, korigovaná na zbytkový hluk, stanovená pro referenční časový interval LAeq,8 h od (dB)', finalLevel.toFixed(1)]);
      data.push(['']);
      data.push(['kombinovaná rozšířená nejistota měření (dB)', uncertainty.toFixed(1)]);
      data.push(['']);
      data.push(['výsledná hodnota hladiny hluku po odečtení nejistoty měření, stanovená pro dobu provozu legalního čerpání LAeq,8 h od (dB)', finalWithUncertainty.toFixed(1)]);
      data.push(['']);
      data.push(['Hygienický limit není prokázatelně překročen', finalWithUncertainty <= dayLimit ? 'ANO' : 'NE']);
      data.push(['']);

      // Night table
      data.push(['NOČNÍ DOBA']);
      data.push(['druh chráněného prostoru', 'OBVYKLPS (oblast s vyšší potřebou klidu a pohody, smíšená)']);
      data.push(['', 'stanovený hygienický limit']);
      data.push(['noční doba', nightLimit.toFixed(1)]);
      data.push(['']);
      data.push(['výsledná dopadající hladina při převodu legalního čerpání, korigovaná na zbytkový hluk, stanovená pro referenční časový interval LAeq,8 h od (dB)', finalLevel.toFixed(1)]);
      data.push(['']);
      data.push(['kombinovaná rozšířená nejistota měření (dB)', uncertainty.toFixed(1)]);
      data.push(['']);
      data.push(['výsledná hodnota hladiny hluku po odečtení nejistoty měření, stanovená pro dobu provozu legalního čerpání LAeq,8 h od (dB)', finalWithUncertainty.toFixed(1)]);
      data.push(['']);
      data.push(['Hygienický limit není prokázatelně překročen', finalWithUncertainty <= nightLimit ? 'ANO' : 'NE']);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Závěr');

    const filename = `stacionarni_zaver_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  if (sourcesWithCalcs.length === 0) {
    return (
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
        <p className="text-yellow-700">
          Nejsou definovány žádné zdroje hluku. Přejdi na záložku "Seznam zdrojů" a vyber zdroje v grafu.
        </p>
      </div>
    );
  }

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

      {sourcesWithCalcs.map(({ source, finalLevel, uncertainty, hasTonal, finalWithUncertainty }) => {
        const dayLimit = hasTonal ? 45 : 50;
        const nightLimit = hasTonal ? 35 : 40;
        const dayExceeded = finalWithUncertainty > dayLimit;
        const nightExceeded = finalWithUncertainty > nightLimit;

        return (
          <div key={source.id} className="space-y-4">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-t-xl">
              <h3 className="text-lg font-semibold">{source.name || 'Zdroj hluku'}</h3>
              {hasTonal && (
                <p className="text-sm text-purple-100 mt-1">⚠️ Výskyt tónové složky - snížený limit</p>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Day table */}
              <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-yellow-100 px-4 py-2 border-b-2 border-gray-200">
                  <h4 className="font-bold text-gray-900">DENNÍ DOBA</h4>
                </div>
                <table className="min-w-full">
                  <tbody className="divide-y divide-gray-200">
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 text-xs text-gray-700">
                        druh chráněného prostoru
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-900 text-right">
                        OBVAYLPS
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 text-xs italic text-gray-600" colSpan={2}>
                        (oblast s vyšší potřebou klidu a pohody, smíšená)
                      </td>
                    </tr>
                    <tr className="bg-blue-50">
                      <td className="px-4 py-3 text-sm text-gray-700" colSpan={2}>
                        <strong>stanovený hygienický limit</strong>
                      </td>
                    </tr>
                    <tr className="bg-blue-100">
                      <td className="px-4 py-3 text-sm text-gray-700">
                        denní doba
                      </td>
                      <td className="px-4 py-3 text-center text-lg font-bold text-gray-900">
                        {dayLimit.toFixed(1)} dB
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-xs text-gray-600" colSpan={2}>
                        výsledná dopadající hladina při převodu legálního čerpání, korigovaná na zbytkový hluk, stanovená pro referenční časový interval L<sub>Aeq,8 h od</sub> (dB)
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 text-center font-semibold text-gray-900" colSpan={2}>
                        {finalLevel.toFixed(1)} dB
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-700" colSpan={2}>
                        kombinovaná rozšířená nejistota měření (dB)
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 text-center font-semibold text-gray-900" colSpan={2}>
                        {uncertainty.toFixed(1)} dB
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-xs text-gray-600" colSpan={2}>
                        výsledná hodnota hladiny hluku po odečtení nejistoty měření, stanovená pro dobu provozu legálního čerpání L<sub>Aeq,8 h od</sub> (dB)
                      </td>
                    </tr>
                    <tr className="bg-yellow-50">
                      <td className="px-4 py-3 text-center font-bold text-gray-900" colSpan={2}>
                        {finalWithUncertainty.toFixed(1)} dB
                      </td>
                    </tr>
                    <tr className={dayExceeded ? 'bg-red-100' : 'bg-green-100'}>
                      <td className={`px-4 py-3 text-sm font-bold text-center ${dayExceeded ? 'text-red-900' : 'text-green-900'}`} colSpan={2}>
                        Hygienický limit není prokázatelně překročen: {dayExceeded ? 'NE ❌' : 'ANO ✅'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Night table */}
              <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-blue-100 px-4 py-2 border-b-2 border-gray-200">
                  <h4 className="font-bold text-gray-900">NOČNÍ DOBA</h4>
                </div>
                <table className="min-w-full">
                  <tbody className="divide-y divide-gray-200">
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 text-xs text-gray-700">
                        druh chráněného prostoru
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-900 text-right">
                        OBVAYLPS
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 text-xs italic text-gray-600" colSpan={2}>
                        (oblast s vyšší potřebou klidu a pohody, smíšená)
                      </td>
                    </tr>
                    <tr className="bg-blue-50">
                      <td className="px-4 py-3 text-sm text-gray-700" colSpan={2}>
                        <strong>stanovený hygienický limit</strong>
                      </td>
                    </tr>
                    <tr className="bg-blue-100">
                      <td className="px-4 py-3 text-sm text-gray-700">
                        noční doba
                      </td>
                      <td className="px-4 py-3 text-center text-lg font-bold text-gray-900">
                        {nightLimit.toFixed(1)} dB
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-xs text-gray-600" colSpan={2}>
                        výsledná dopadající hladina při převodu legálního čerpání, korigovaná na zbytkový hluk, stanovená pro referenční časový interval L<sub>Aeq,8 h od</sub> (dB)
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 text-center font-semibold text-gray-900" colSpan={2}>
                        {finalLevel.toFixed(1)} dB
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-700" colSpan={2}>
                        kombinovaná rozšířená nejistota měření (dB)
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 text-center font-semibold text-gray-900" colSpan={2}>
                        {uncertainty.toFixed(1)} dB
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-xs text-gray-600" colSpan={2}>
                        výsledná hodnota hladiny hluku po odečtení nejistoty měření, stanovená pro dobu provozu legálního čerpání L<sub>Aeq,8 h od</sub> (dB)
                      </td>
                    </tr>
                    <tr className="bg-yellow-50">
                      <td className="px-4 py-3 text-center font-bold text-gray-900" colSpan={2}>
                        {finalWithUncertainty.toFixed(1)} dB
                      </td>
                    </tr>
                    <tr className={nightExceeded ? 'bg-red-100' : 'bg-green-100'}>
                      <td className={`px-4 py-3 text-sm font-bold text-center ${nightExceeded ? 'text-red-900' : 'text-green-900'}`} colSpan={2}>
                        Hygienický limit není prokázatelně překročen: {nightExceeded ? 'NE ❌' : 'ANO ✅'}
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
