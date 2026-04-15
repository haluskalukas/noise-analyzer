'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { NoiseStats } from '@/types';
import { HourlyTrafficCount, GroupedTrafficSummary } from '@/types/traffic';
import { calculateTrafficSummary } from '@/lib/trafficCalculations';
import { calculateNoise } from '@/lib/noiseCalculator';

interface SummaryProps {
  measuredDayAvg: number; // naměřený průměr den ze statistik
  measuredNightAvg: number; // naměřený průměr noc ze statistik
  rpdiCorrectionDay: number; // korekce na RPDI den (rozdíl z kalkulátoru)
  rpdiCorrectionNight: number; // korekce na RPDI noc (rozdíl z kalkulátoru)
  address?: string;
  onAddressChange?: (address: string) => void;
  facadeReflection?: boolean;
  onFacadeReflectionChange?: (value: boolean) => void;
  uncertainty?: number;
  onUncertaintyChange?: (value: number) => void;
  roadBefore2001?: boolean;
  onRoadBefore2001Change?: (value: boolean) => void;
  // Data pro Excel export
  stats?: NoiseStats | null;
  trafficCounts?: HourlyTrafficCount[];
  countingGrouped?: GroupedTrafficSummary | null;
  rpdiGrouped?: GroupedTrafficSummary | null;
  speed?: number;
}

// Helper funkce pro formátování čísel s českou desetinnou čárkou
function formatCzechNumber(num: number, decimals: number = 1): string {
  return num.toFixed(decimals).replace('.', ',');
}

export default function Summary({
  measuredDayAvg,
  measuredNightAvg,
  rpdiCorrectionDay,
  rpdiCorrectionNight,
  address: externalAddress,
  onAddressChange,
  facadeReflection: externalFacadeReflection,
  onFacadeReflectionChange,
  uncertainty: externalUncertainty,
  onUncertaintyChange,
  roadBefore2001: externalRoadBefore2001,
  onRoadBefore2001Change,
  stats,
  trafficCounts,
  countingGrouped,
  rpdiGrouped,
  speed,
}: SummaryProps) {
  // Použij external state pokud je poskytnut, jinak internal state
  const [internalAddress, setInternalAddress] = useState<string>('');
  const [internalFacadeReflection, setInternalFacadeReflection] = useState<boolean>(false);
  const [internalUncertainty, setInternalUncertainty] = useState<number>(1.8);
  const [internalRoadBefore2001, setInternalRoadBefore2001] = useState<boolean>(false);
  const [startHour, setStartHour] = useState<number>(0);

  const address = externalAddress ?? internalAddress;
  const facadeReflection = externalFacadeReflection ?? internalFacadeReflection;
  const uncertainty = externalUncertainty ?? internalUncertainty;
  const roadBefore2001 = externalRoadBefore2001 ?? internalRoadBefore2001;

  const setAddress = (value: string) => {
    if (onAddressChange) {
      onAddressChange(value);
    } else {
      setInternalAddress(value);
    }
  };

  const setFacadeReflection = (value: boolean) => {
    if (onFacadeReflectionChange) {
      onFacadeReflectionChange(value);
    } else {
      setInternalFacadeReflection(value);
    }
  };

  const setUncertainty = (value: number) => {
    if (onUncertaintyChange) {
      onUncertaintyChange(value);
    } else {
      setInternalUncertainty(value);
    }
  };

  const setRoadBefore2001 = (value: boolean) => {
    if (onRoadBefore2001Change) {
      onRoadBefore2001Change(value);
    } else {
      setInternalRoadBefore2001(value);
    }
  };

  // Korekce na odraz
  const reflectionCorrection = facadeReflection ? -2 : 0;

  // Hygienické limity
  const limitDay = roadBefore2001 ? 68 : 60;
  const limitNight = roadBefore2001 ? 58 : 50;

  // Výsledné hodnoty
  // Výsledná = Naměřená + Korekce odraz + Korekce RPDI - Nejistota
  const finalDay =
    measuredDayAvg > 0
      ? Math.round((measuredDayAvg + reflectionCorrection + rpdiCorrectionDay - uncertainty) * 10) / 10
      : null;

  const finalNight =
    measuredNightAvg > 0
      ? Math.round((measuredNightAvg + reflectionCorrection + rpdiCorrectionNight - uncertainty) * 10) / 10
      : null;

  // Vyhodnocení limitu
  const exceedsLimitDay = finalDay !== null && finalDay > limitDay;
  const exceedsLimitNight = finalNight !== null && finalNight > limitNight;

  // Helper funkce pro přeuspořádání hodin od startHour
  const reorderHours = (data: any[], startHour: number) => {
    const reordered = [];
    for (let i = 0; i < 24; i++) {
      const hour = (startHour + i) % 24;
      reordered.push(data[hour]);
    }
    return reordered;
  };

  // Export do Excelu
  const handleExcelExport = () => {
    if (!stats || !trafficCounts || !countingGrouped) {
      alert('Není k dispozici dostatek dat pro export.');
      return;
    }

    const workbook = XLSX.utils.book_new();

    // ===== LIST 1: SOUHRN =====
    const souhrnData = [
      ['SOUHRN MĚŘENÍ'],
      [],
      ['Adresa měření:', address || ''],
      ['Datum exportu:', new Date().toLocaleDateString('cs-CZ')],
      [],
      ['PARAMETRY:'],
      ['Odraz od fasády:', facadeReflection ? 'ANO (-2 dB)' : 'NE (0 dB)'],
      ['Nejistota měření:', formatCzechNumber(uncertainty) + ' dB'],
      ['Silnice zprovozněna před rokem 2001:', roadBefore2001 ? 'ANO' : 'NE'],
      ['Hygienické limity den/noc:', `${formatCzechNumber(limitDay)}/${formatCzechNumber(limitNight)} dB(A)`],
      [],
      ['VÝSLEDKY VYHODNOCENÍ:'],
      [
        'Adresa',
        'Naměřená den [dB(A)]',
        'Naměřená noc [dB(A)]',
        'Korekce odraz [dB]',
        'Korekce RPDI den [dB]',
        'Korekce RPDI noc [dB]',
        'Nejistota [dB]',
        'Výsledná den [dB(A)]',
        'Výsledná noc [dB(A)]',
        'Limit den [dB(A)]',
        'Limit noc [dB(A)]',
      ],
      [
        address || '',
        measuredDayAvg > 0 ? formatCzechNumber(measuredDayAvg) : '—',
        measuredNightAvg > 0 ? formatCzechNumber(measuredNightAvg) : '—',
        formatCzechNumber(reflectionCorrection),
        formatCzechNumber(rpdiCorrectionDay),
        formatCzechNumber(rpdiCorrectionNight),
        formatCzechNumber(uncertainty),
        finalDay !== null ? formatCzechNumber(finalDay) : '—',
        finalNight !== null ? formatCzechNumber(finalNight) : '—',
        formatCzechNumber(limitDay),
        formatCzechNumber(limitNight),
      ],
      [],
      ['VYHODNOCENÍ:'],
      ['Den:', exceedsLimitDay ? 'Hygienický limit JE překročen' : 'Hygienický limit NENÍ překročen'],
      ['Noc:', exceedsLimitNight ? 'Hygienický limit JE překročen' : 'Hygienický limit NENÍ překročen'],
    ];

    const ws1 = XLSX.utils.aoa_to_sheet(souhrnData);
    XLSX.utils.book_append_sheet(workbook, ws1, 'Souhrn');

    // ===== LIST 2: STATISTIKY =====
    const statistikyData = [
      ['HODINOVÉ STATISTIKY'],
      [],
      ['Čas', 'LAeq [dB(A)]', 'p5 [dB(A)]', 'p10 [dB(A)]', 'p90 [dB(A)]', 'p95 [dB(A)]'],
    ];

    // Přeuspořádané hodiny
    const reorderedHours = reorderHours(stats.hourlyAvgs, startHour);
    reorderedHours.forEach((hourData) => {
      const displayHour = hourData.hour.toString().padStart(2, '0') + ':00';
      statistikyData.push([
        displayHour,
        formatCzechNumber(hourData.avg),
        formatCzechNumber(hourData.p5),
        formatCzechNumber(hourData.p10),
        formatCzechNumber(hourData.p90),
        formatCzechNumber(hourData.p95),
      ]);
    });

    statistikyData.push([]);
    statistikyData.push(['PRŮMĚRY:']);
    statistikyData.push(['Den (6-22h):', formatCzechNumber(stats.dayAvg) + ' dB(A)']);
    statistikyData.push(['Noc (22-6h):', formatCzechNumber(stats.nightAvg) + ' dB(A)']);

    const ws2 = XLSX.utils.aoa_to_sheet(statistikyData);
    XLSX.utils.book_append_sheet(workbook, ws2, 'Statistiky');

    // ===== LIST 3: SČÍTÁNÍ DOPRAVY =====
    const scitaniData = [
      ['24HODINOVÁ TABULKA SČÍTÁNÍ'],
      [],
      ['Čas', 'OA', 'LN', 'N', 'A', 'M', 'K'],
    ];

    // Přeuspořádané hodiny sčítání
    const reorderedTraffic = reorderHours(trafficCounts, startHour);
    reorderedTraffic.forEach((hourData, index) => {
      const displayHour = hourData.hour.toString().padStart(2, '0') + ':00';
      scitaniData.push([
        displayHour,
        hourData.OA,
        hourData.LN,
        hourData.N,
        hourData.A,
        hourData.M,
        hourData.K,
      ]);
    });

    // Součty podle období
    const summary = calculateTrafficSummary(trafficCounts);
    scitaniData.push([]);
    scitaniData.push(['SOUČTY PODLE OBDOBÍ:']);
    scitaniData.push(['Období', 'OA', 'LN', 'N', 'A', 'M', 'K']);
    scitaniData.push([
      'Den (6-22h)',
      summary.day.OA.toString(),
      summary.day.LN.toString(),
      summary.day.N.toString(),
      summary.day.A.toString(),
      summary.day.M.toString(),
      summary.day.K.toString(),
    ]);
    scitaniData.push([
      'Noc (22-6h)',
      summary.night.OA.toString(),
      summary.night.LN.toString(),
      summary.night.N.toString(),
      summary.night.A.toString(),
      summary.night.M.toString(),
      summary.night.K.toString(),
    ]);
    scitaniData.push([
      'Celkem 24h',
      summary.total.OA.toString(),
      summary.total.LN.toString(),
      summary.total.N.toString(),
      summary.total.A.toString(),
      summary.total.M.toString(),
      summary.total.K.toString(),
    ]);

    // Seskupené kategorie - Sčítání
    scitaniData.push([]);
    scitaniData.push(['SESKUPENÉ KATEGORIE - SČÍTÁNÍ:']);
    scitaniData.push(['Kategorie 1: OA+LN+M  •  Kategorie 2: A+N  •  Kategorie 3: K']);
    scitaniData.push(['Období', 'Kategorie 1', 'Kategorie 2', 'Kategorie 3']);
    scitaniData.push([
      'Den (6-22h)',
      countingGrouped.day.category1.toString(),
      countingGrouped.day.category2.toString(),
      countingGrouped.day.category3.toString(),
    ]);
    scitaniData.push([
      'Noc (22-6h)',
      countingGrouped.night.category1.toString(),
      countingGrouped.night.category2.toString(),
      countingGrouped.night.category3.toString(),
    ]);
    scitaniData.push([
      'Celkem 24h',
      countingGrouped.total.category1.toString(),
      countingGrouped.total.category2.toString(),
      countingGrouped.total.category3.toString(),
    ]);

    // Seskupené kategorie - RPDI (pokud existuje)
    if (rpdiGrouped) {
      scitaniData.push([]);
      scitaniData.push(['SESKUPENÉ KATEGORIE - RPDI (TP 189):']);
      scitaniData.push(['Kategorie 1: OA+LN+M  •  Kategorie 2: A+N  •  Kategorie 3: K (z RPDI hodnot)']);
      scitaniData.push(['Období', 'Kategorie 1', 'Kategorie 2', 'Kategorie 3']);
      scitaniData.push([
        'Den (6-22h)',
        rpdiGrouped.day.category1.toString(),
        rpdiGrouped.day.category2.toString(),
        rpdiGrouped.day.category3.toString(),
      ]);
      scitaniData.push([
        'Noc (22-6h)',
        rpdiGrouped.night.category1.toString(),
        rpdiGrouped.night.category2.toString(),
        rpdiGrouped.night.category3.toString(),
      ]);
      scitaniData.push([
        'Celkem 24h',
        rpdiGrouped.total.category1.toString(),
        rpdiGrouped.total.category2.toString(),
        rpdiGrouped.total.category3.toString(),
      ]);
    }

    const ws3 = XLSX.utils.aoa_to_sheet(scitaniData);
    XLSX.utils.book_append_sheet(workbook, ws3, 'Sčítání dopravy');

    // ===== LIST 4: VÝPOČET HLUKU =====
    const hlukData = [
      ['VÝPOČET HLUKU'],
      [],
      ['PARAMETRY:'],
      ['Rychlost vozidel:', (speed || 50) + ' km/h'],
      ['Vzdálenost od osy silnice:', '7,5 m (fixní)'],
      [],
      ['SESKUPENÉ KATEGORIE - SČÍTÁNÍ:'],
      ['Kategorie 1: OA+LN+M  •  Kategorie 2: A+N  •  Kategorie 3: K'],
      ['Období', 'Kategorie 1', 'Kategorie 2', 'Kategorie 3'],
      [
        'Den (6-22h)',
        countingGrouped.day.category1.toString(),
        countingGrouped.day.category2.toString(),
        countingGrouped.day.category3.toString(),
      ],
      [
        'Noc (22-6h)',
        countingGrouped.night.category1.toString(),
        countingGrouped.night.category2.toString(),
        countingGrouped.night.category3.toString(),
      ],
      [
        'Celkem 24h',
        countingGrouped.total.category1.toString(),
        countingGrouped.total.category2.toString(),
        countingGrouped.total.category3.toString(),
      ],
    ];

    if (rpdiGrouped) {
      hlukData.push([]);
      hlukData.push(['SESKUPENÉ KATEGORIE - RPDI (TP 189):']);
      hlukData.push(['Kategorie 1: OA+LN+M  •  Kategorie 2: A+N  •  Kategorie 3: K (z RPDI hodnot)']);
      hlukData.push(['Období', 'Kategorie 1', 'Kategorie 2', 'Kategorie 3']);
      hlukData.push([
        'Den (6-22h)',
        rpdiGrouped.day.category1.toString(),
        rpdiGrouped.day.category2.toString(),
        rpdiGrouped.day.category3.toString(),
      ]);
      hlukData.push([
        'Noc (22-6h)',
        rpdiGrouped.night.category1.toString(),
        rpdiGrouped.night.category2.toString(),
        rpdiGrouped.night.category3.toString(),
      ]);
      hlukData.push([
        'Celkem 24h',
        rpdiGrouped.total.category1.toString(),
        rpdiGrouped.total.category2.toString(),
        rpdiGrouped.total.category3.toString(),
      ]);
    }

    // Výpočet hluku ze sčítání
    const countingNoiseDay = calculateNoise({
      category1: countingGrouped.day.category1,
      category2: countingGrouped.day.category2,
      category3: countingGrouped.day.category3,
      speed: speed || 50,
    });

    const countingNoiseNight = calculateNoise({
      category1: countingGrouped.night.category1,
      category2: countingGrouped.night.category2,
      category3: countingGrouped.night.category3,
      speed: speed || 50,
    });

    // Výpočet hluku z RPDI (pokud existuje)
    let rpdiNoiseDay = null;
    let rpdiNoiseNight = null;
    let differenceDay = null;
    let differenceNight = null;
    let finalDayNoise = null;
    let finalNightNoise = null;

    if (rpdiGrouped) {
      rpdiNoiseDay = calculateNoise({
        category1: rpdiGrouped.day.category1,
        category2: rpdiGrouped.day.category2,
        category3: rpdiGrouped.day.category3,
        speed: speed || 50,
      });

      rpdiNoiseNight = calculateNoise({
        category1: rpdiGrouped.night.category1,
        category2: rpdiGrouped.night.category2,
        category3: rpdiGrouped.night.category3,
        speed: speed || 50,
      });

      differenceDay = Math.round((rpdiNoiseDay.LAeq - countingNoiseDay.LAeq) * 10) / 10;
      differenceNight = Math.round((rpdiNoiseNight.LAeq - countingNoiseNight.LAeq) * 10) / 10;

      if (measuredDayAvg > 0) {
        finalDayNoise = Math.round((measuredDayAvg + differenceDay) * 10) / 10;
      }
      if (measuredNightAvg > 0) {
        finalNightNoise = Math.round((measuredNightAvg + differenceNight) * 10) / 10;
      }
    }

    hlukData.push([]);
    hlukData.push(['TABULKA VÝSLEDKŮ:']);
    hlukData.push([
      'Období',
      'Naměřené hodnoty [dB(A)]',
      'Hluk 7,5m - sčítání [dB(A)]',
      'Hluk 7,5m - RPDI [dB(A)]',
      'Rozdíl [dB(A)]',
      'Výsledná hodnota [dB(A)]',
    ]);
    hlukData.push([
      'Den (6-22h)',
      measuredDayAvg > 0 ? formatCzechNumber(measuredDayAvg) : '—',
      formatCzechNumber(countingNoiseDay.LAeq),
      rpdiNoiseDay ? formatCzechNumber(rpdiNoiseDay.LAeq) : '—',
      differenceDay !== null ? formatCzechNumber(differenceDay) : '—',
      finalDayNoise !== null ? formatCzechNumber(finalDayNoise) : '—',
    ]);
    hlukData.push([
      'Noc (22-6h)',
      measuredNightAvg > 0 ? formatCzechNumber(measuredNightAvg) : '—',
      formatCzechNumber(countingNoiseNight.LAeq),
      rpdiNoiseNight ? formatCzechNumber(rpdiNoiseNight.LAeq) : '—',
      differenceNight !== null ? formatCzechNumber(differenceNight) : '—',
      finalNightNoise !== null ? formatCzechNumber(finalNightNoise) : '—',
    ]);

    const ws4 = XLSX.utils.aoa_to_sheet(hlukData);
    XLSX.utils.book_append_sheet(workbook, ws4, 'Výpočet hluku');

    // Stáhnout Excel soubor
    const fileName = `Mereni_hluku_${address ? address.replace(/[^a-zA-Z0-9]/g, '_') : 'export'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="space-y-6">
      {/* Nadpis */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">📋 Souhrn měření</h2>
        <p className="text-gray-600">Finální vyhodnocení hluku s korekcemi a porovnání s hygienickými limity</p>
      </div>

      {/* Parametry */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Parametry vyhodnocení</h3>

        <div className="space-y-4">
          {/* Adresa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adresa měření</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Např. Hlavní 123, Praha"
            />
          </div>

          {/* Odraz od fasády */}
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Odraz od fasády:</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={facadeReflection === true}
                  onChange={() => setFacadeReflection(true)}
                  className="mr-2"
                />
                <span className="text-sm">ANO (korekce -2 dB)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={facadeReflection === false}
                  onChange={() => setFacadeReflection(false)}
                  className="mr-2"
                />
                <span className="text-sm">NE (korekce 0 dB)</span>
              </label>
            </div>
          </div>

          {/* Nejistota */}
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Nejistota měření:</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={uncertainty === 1.8}
                  onChange={() => setUncertainty(1.8)}
                  className="mr-2"
                />
                <span className="text-sm">1,8 dB</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={uncertainty === 1.7}
                  onChange={() => setUncertainty(1.7)}
                  className="mr-2"
                />
                <span className="text-sm">1,7 dB</span>
              </label>
            </div>
          </div>

          {/* Rok zprovoznění */}
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Byla silnice zprovozněna před rokem 2001?</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={roadBefore2001 === true}
                  onChange={() => setRoadBefore2001(true)}
                  className="mr-2"
                />
                <span className="text-sm">ANO (limit 68/58 dB)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={roadBefore2001 === false}
                  onChange={() => setRoadBefore2001(false)}
                  className="mr-2"
                />
                <span className="text-sm">NE (limit 60/50 dB)</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Export do Excelu */}
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold mb-4 text-blue-900">📥 Export do Excelu</h3>
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nastavit čas začátku měření (hodina)
            </label>
            <select
              value={startHour}
              onChange={(e) => setStartHour(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {i.toString().padStart(2, '0')}:00
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Tabulky v Excelu budou začínat od této hodiny
            </p>
          </div>
          <div className="flex-1">
            <button
              onClick={handleExcelExport}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors font-semibold shadow-sm flex items-center gap-2"
            >
              📥 Stáhnout do Excelu
            </button>
          </div>
        </div>
      </div>

      {/* Tabulka výsledků */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Výsledky vyhodnocení</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Adresa
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Naměřená hodnota den [dB(A)]
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Naměřená hodnota noc [dB(A)]
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Korekce odraz [dB]
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Korekce RPDI den [dB]
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Korekce RPDI noc [dB]
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Nejistota [dB]
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider bg-blue-50">
                  Výsledná hodnota den [dB(A)]
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider bg-blue-50">
                  Výsledná hodnota noc [dB(A)]
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Limit den [dB(A)]
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Limit noc [dB(A)]
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                {/* Adresa */}
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {address || '—'}
                </td>

                {/* Naměřená den */}
                <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                  {measuredDayAvg > 0 ? formatCzechNumber(measuredDayAvg) : '—'}
                </td>

                {/* Naměřená noc */}
                <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                  {measuredNightAvg > 0 ? formatCzechNumber(measuredNightAvg) : '—'}
                </td>

                {/* Korekce odraz */}
                <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                  {formatCzechNumber(reflectionCorrection)}
                </td>

                {/* Korekce RPDI den */}
                <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                  <span className={rpdiCorrectionDay > 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                    {rpdiCorrectionDay > 0 ? '+' : ''}
                    {formatCzechNumber(rpdiCorrectionDay)}
                  </span>
                </td>

                {/* Korekce RPDI noc */}
                <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                  <span className={rpdiCorrectionNight > 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                    {rpdiCorrectionNight > 0 ? '+' : ''}
                    {formatCzechNumber(rpdiCorrectionNight)}
                  </span>
                </td>

                {/* Nejistota */}
                <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                  {formatCzechNumber(uncertainty)}
                </td>

                {/* Výsledná den */}
                <td className={`px-4 py-4 whitespace-nowrap text-sm text-center font-bold ${exceedsLimitDay ? 'bg-red-100 text-red-900' : 'bg-green-100 text-green-900'}`}>
                  {finalDay !== null ? formatCzechNumber(finalDay) : '—'}
                </td>

                {/* Výsledná noc */}
                <td className={`px-4 py-4 whitespace-nowrap text-sm text-center font-bold ${exceedsLimitNight ? 'bg-red-100 text-red-900' : 'bg-green-100 text-green-900'}`}>
                  {finalNight !== null ? formatCzechNumber(finalNight) : '—'}
                </td>

                {/* Limit den */}
                <td className="px-4 py-4 whitespace-nowrap text-sm text-center font-semibold text-gray-900">
                  {formatCzechNumber(limitDay)}
                </td>

                {/* Limit noc */}
                <td className="px-4 py-4 whitespace-nowrap text-sm text-center font-semibold text-gray-900">
                  {formatCzechNumber(limitNight)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Informace */}
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">ℹ️ Vysvětlivky</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p>
            <strong>Výpočet výsledné hodnoty:</strong> Naměřená hodnota + Korekce na odraz + Korekce na RPDI - Nejistota
          </p>
          <p>
            <strong>Hygienické limity:</strong> Podle zákona č. 258/2000 Sb. o ochraně veřejného zdraví
          </p>
          <p>
            <strong>Silnice zprovozněná před rokem 2001:</strong> Den 68 dB(A), Noc 58 dB(A)
          </p>
          <p>
            <strong>Silnice zprovozněná po roce 2001:</strong> Den 60 dB(A), Noc 50 dB(A)
          </p>
          <p>
            <strong>Prokazatelné překročení:</strong> Limit je překročen, pokud výsledná hodnota je vyšší než hygienický limit
          </p>
        </div>
      </div>
    </div>
  );
}
