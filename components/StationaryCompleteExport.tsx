'use client';

import { StationarySource, STATIONARY_FREQUENCY_LIST } from '@/types/stationary';
import { formatNumber } from '@/lib/format';
import * as XLSX from 'xlsx';

interface StationaryCompleteExportProps {
  sources: StationarySource[];
  allSources: StationarySource[];
  reflectionCorrections: Map<string, boolean>;
}

// Calculate logarithmic subtraction (korekce na zbytkový hluk)
const calculateBackgroundCorrection = (sourceLevel: number, backgroundLevel: number): number => {
  const difference = sourceLevel - backgroundLevel;

  if (difference < 3) {
    return 0;
  } else if (difference >= 3 && difference < 10) {
    const sourcePower = Math.pow(10, sourceLevel / 10);
    const backgroundPower = Math.pow(10, backgroundLevel / 10);
    const correctedPower = sourcePower - backgroundPower;

    if (correctedPower <= 0) return 0;

    const correctedLevel = 10 * Math.log10(correctedPower);
    return correctedLevel - sourceLevel;
  } else {
    return 0;
  }
};

const hasTonalComponents = (source: StationarySource): boolean => {
  return source.tonalComponents?.some(tc => tc) || false;
};

export function StationaryCompleteExport({ sources, allSources, reflectionCorrections }: StationaryCompleteExportProps) {

  const handleCompleteExport = () => {
    const wb = XLSX.utils.book_new();

    // SHEET 1: Přehled všech zdrojů
    const overviewData: any[] = [];
    overviewData.push(['Přehled měření - Stacionární zdroje hluku']);
    overviewData.push(['']);
    overviewData.push(['Název', 'Typ', 'Čas měření', 'LAeq (dB)', 'L5 (dB)', 'L10 (dB)', 'L90 (dB)', 'L95 (dB)', 'Min (dB)', 'Max (dB)']);

    sources.forEach(source => {
      const startTime = `${source.startTime.getHours().toString().padStart(2, '0')}:${source.startTime.getMinutes().toString().padStart(2, '0')}:${source.startTime.getSeconds().toString().padStart(2, '0')}`;
      const endTime = `${source.endTime.getHours().toString().padStart(2, '0')}:${source.endTime.getMinutes().toString().padStart(2, '0')}:${source.endTime.getSeconds().toString().padStart(2, '0')}`;
      const timeRange = `${startTime} - ${endTime}`;
      const type = source.type === 'source' ? 'Zdroj hluku' : 'Hluk pozadí';

      overviewData.push([
        source.name || type,
        type,
        timeRange,
        formatNumber(source.laeq),
        formatNumber(source.l5),
        formatNumber(source.l10),
        formatNumber(source.l90),
        formatNumber(source.l95),
        formatNumber(source.min),
        formatNumber(source.max),
      ]);
    });

    const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(wb, wsOverview, 'Přehled');

    // SHEETS 2+: Pro každý zdroj hluku samostatný list
    const sourcesOnly = sources.filter(s => s.type === 'source');
    const background = allSources.find(s => s.type === 'background');

    sourcesOnly.forEach((source, sourceIndex) => {
      const sourceData: any[] = [];
      const hasTonal = hasTonalComponents(source);

      // Header
      sourceData.push([`Detail měření: ${source.name || 'Zdroj hluku'}`]);
      sourceData.push(['']);

      // Základní údaje
      sourceData.push(['ZÁKLADNÍ ÚDAJE']);
      sourceData.push(['']);

      const startTime = `${source.startTime.getHours().toString().padStart(2, '0')}:${source.startTime.getMinutes().toString().padStart(2, '0')}:${source.startTime.getSeconds().toString().padStart(2, '0')}`;
      const endTime = `${source.endTime.getHours().toString().padStart(2, '0')}:${source.endTime.getMinutes().toString().padStart(2, '0')}:${source.endTime.getSeconds().toString().padStart(2, '0')}`;

      sourceData.push(['Název měření', source.name || 'Zdroj hluku']);
      sourceData.push(['Typ', 'Zdroj hluku']);
      sourceData.push(['Čas měření', `${startTime} - ${endTime}`]);
      sourceData.push(['']);

      // Naměřené hodnoty
      sourceData.push(['NAMĚŘENÉ HODNOTY']);
      sourceData.push(['LAeq (dB)', formatNumber(source.laeq)]);
      sourceData.push(['L5 (dB)', formatNumber(source.l5)]);
      sourceData.push(['L10 (dB)', formatNumber(source.l10)]);
      sourceData.push(['L90 (dB)', formatNumber(source.l90)]);
      sourceData.push(['L95 (dB)', formatNumber(source.l95)]);
      sourceData.push(['Min (dB)', formatNumber(source.min)]);
      sourceData.push(['Max (dB)', formatNumber(source.max)]);
      sourceData.push(['']);

      // Frekvenční spektrum
      sourceData.push(['FREKVENČNÍ SPEKTRUM - 1/3 oktávová pásma']);
      sourceData.push(['']);
      sourceData.push(['Frekvence [Hz]', ...STATIONARY_FREQUENCY_LIST.map(f => f.toString())]);
      sourceData.push([
        source.name || 'Zdroj hluku',
        ...source.avgFrequencies.map(v => formatNumber(v))
      ]);

      if (background) {
        sourceData.push([
          background.name || 'Hluk pozadí',
          ...background.avgFrequencies.map(v => formatNumber(v))
        ]);
      }
      sourceData.push(['']);

      // Tónová složka
      sourceData.push(['Výskyt tónové složky', hasTonal ? 'ANO' : 'NE']);
      sourceData.push(['']);

      // DOPOČET
      sourceData.push(['DOPOČET - KOREKCE']);
      sourceData.push(['']);

      if (background) {
        const difference = source.laeq - background.laeq;
        let status = '';
        if (difference < 3) {
          status = 'Naměřený zdroj hluku nebylo možné jednoznačně odlišit od zbytkového hluku';
        } else if (difference >= 3 && difference < 10) {
          status = 'Naměřené hodnoty budou dále korigovány na zbytkový hluk';
        } else {
          status = 'Nekoriguje se';
        }

        sourceData.push(['Rozdíl mezi zdrojem a pozadím', formatNumber(difference) + ' dB']);
        sourceData.push(['Hodnocení', status]);
        sourceData.push(['']);

        const bgCorrection = calculateBackgroundCorrection(source.laeq, background.laeq);
        const reflectionCorrection = reflectionCorrections.get(source.id) ? -2.0 : 0.0;
        const finalLevel = source.laeq + bgCorrection + reflectionCorrection;

        sourceData.push(['naměřená hodnota LAeq - nekorigovaná na zbytkový hluk (dB)', formatNumber(source.laeq)]);
        sourceData.push(['korekce na zbytkový hluk (dB)', formatNumber(bgCorrection)]);
        sourceData.push(['korekce na vliv odrazivé plochy (dB)', formatNumber(reflectionCorrection)]);
        sourceData.push(['výsledná dopadající hladina LAeq,T pro dobu provozu zdroje hluku (dB)', formatNumber(finalLevel)]);
        sourceData.push(['']);

        // ZÁVĚR
        sourceData.push(['ZÁVĚR - HODNOCENÍ HYGIENICKÝCH LIMITŮ']);
        sourceData.push(['']);

        const uncertainty = bgCorrection !== 0 ? 1.8 : 1.7;
        const finalWithUncertainty = finalLevel - uncertainty;

        const dayLimit = hasTonal ? 45 : 50;
        const nightLimit = hasTonal ? 35 : 40;

        // Denní doba
        sourceData.push(['DENNÍ DOBA']);
        sourceData.push(['druh chráněného prostoru', 'CHVePS']);
        sourceData.push(['stanovený hygienický limit - denní doba (dB)', formatNumber(dayLimit)]);
        sourceData.push(['']);

        let correctionText;
        if (difference < 3) {
          correctionText = 'výsledná dopadající hladina, včetně zbytkového hluku';
        } else if (difference >= 3 && difference < 10) {
          correctionText = 'výsledná dopadající hladina, korigována na zbytkový hluk';
        } else {
          correctionText = 'výsledná dopadající hladina, nekorigována na zbytkový hluk';
        }

        sourceData.push([`${correctionText}, stanovena pro referenční časový interval LAeq,8 hod (dB)`, formatNumber(finalLevel)]);
        sourceData.push(['kombinovaná rozšířená nejistota měření (dB)', formatNumber(uncertainty)]);
        sourceData.push(['výsledná hodnota hladiny hluku po odečtení nejistoty měření, stanovena pro dobu provozu zdroje hluku LAeq,8 hod (dB)', formatNumber(finalWithUncertainty)]);

        const dayConclusion = finalWithUncertainty > dayLimit
          ? 'Hygienický limit je prokázatelně překročen'
          : 'Hygienický limit není prokázatelně překročen';
        sourceData.push([dayConclusion]);
        sourceData.push(['']);

        // Noční doba
        sourceData.push(['NOČNÍ DOBA']);
        sourceData.push(['druh chráněného prostoru', 'CHVePS']);
        sourceData.push(['stanovený hygienický limit - noční doba (dB)', formatNumber(nightLimit)]);
        sourceData.push(['']);
        sourceData.push([`${correctionText}, stanovena pro referenční časový interval LAeq,1 hod (dB)`, formatNumber(finalLevel)]);
        sourceData.push(['kombinovaná rozšířená nejistota měření (dB)', formatNumber(uncertainty)]);
        sourceData.push(['výsledná hodnota hladiny hluku po odečtení nejistoty měření, stanovena pro dobu provozu zdroje hluku LAeq,1 hod (dB)', formatNumber(finalWithUncertainty)]);

        const nightConclusion = finalWithUncertainty > nightLimit
          ? 'Hygienický limit je prokázatelně překročen'
          : 'Hygienický limit není prokázatelně překročen';
        sourceData.push([nightConclusion]);

      } else {
        sourceData.push(['Hluk pozadí nebyl definován']);
      }

      const ws = XLSX.utils.aoa_to_sheet(sourceData);
      const sheetName = (source.name || `Zdroj ${sourceIndex + 1}`).substring(0, 31); // Excel limit 31 chars
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    // Export
    const filename = `stacionarni_kompletni_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  return (
    <button
      onClick={handleCompleteExport}
      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
    >
      📊 Exportovat kompletní Excel
    </button>
  );
}
