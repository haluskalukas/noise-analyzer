'use client';

import { useState } from 'react';
import Link from 'next/link';
import SoundInsulationFileUpload from '@/components/SoundInsulationFileUpload';
import SoundInsulationChart from '@/components/SoundInsulationChart';
import SoundInsulationResults from '@/components/SoundInsulationResults';

// Standardní tercové frekvence pro stavební akustiku (100 Hz - 3150 Hz podle ČSN EN ISO 717-1)
export const STANDARD_FREQUENCIES = [
  100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000,
  1250, 1600, 2000, 2500, 3150
];

// Referenční křivka pro vzduchovou neprůzvučnost podle ČSN EN ISO 717-1
// Hodnoty R'ref pro frekvence 100-3150 Hz
export const REFERENCE_CURVE: Record<number, number> = {
  100: 33,
  125: 36,
  160: 39,
  200: 42,
  250: 45,
  315: 48,
  400: 51,
  500: 52,
  630: 53,
  800: 54,
  1000: 55,
  1250: 56,
  1600: 56,
  2000: 56,
  2500: 56,
  3150: 56
};

// Měřená data pro jednu frekvenci
export interface FrequencyMeasurement {
  frequency: number;  // Hz
  L1: number;         // dB - Hladina ve vysílací místnosti
  L2: number;         // dB - Hladina v přijímací místnosti
  T: number;          // s - Doba dozvuku v přijímací místnosti
}

// Vypočtená data pro jednu frekvenci
export interface FrequencyResult extends FrequencyMeasurement {
  A: number;          // m² - Ekvivalentní pohltivá plocha
  R: number;          // dB - Stavební neprůzvučnost R'
  DnT: number;        // dB - Normovaný rozdíl hladin
}

// Vstupní parametry místnosti
export interface RoomParameters {
  volume: number;     // m³ - Objem přijímací místnosti
  area: number;       // m² - Plocha měřené konstrukce
}

// Vážený index neprůzvučnosti
export interface WeightedIndex {
  value: number;           // dB - Vážená hodnota (R'w nebo DnT,w)
  shift: number;           // dB - Posun referenční křivky
  unfavorableDeviations: number; // dB - Součet nepříznivých odchylek
  C: number;               // dB - Adaptační člen C (spektrum 1)
  Ctr: number;             // dB - Adaptační člen Ctr (spektrum 2)
}

// Funkce pro výpočet váženého indexu podle ČSN EN ISO 717-1
export function calculateWeightedIndex(results: FrequencyResult[]): WeightedIndex {
  // Zjistit, zda máme všechny standardní frekvence
  const hasAllFrequencies = STANDARD_FREQUENCIES.every(freq =>
    results.some(r => r.frequency === freq)
  );

  if (!hasAllFrequencies) {
    // Pokud nemáme všechny frekvence, vrátit nulové hodnoty
    return { value: 0, shift: 0, unfavorableDeviations: 0, C: 0, Ctr: 0 };
  }

  // Seřadit výsledky podle frekvence a použít R' hodnoty
  const sortedResults = [...results].sort((a, b) => a.frequency - b.frequency);

  // Najít optimální posun referenční křivky podle ISO 717-1
  // Křivka se posunuje NAHORU, dokud součet nepříznivých odchylek nepřekročí 32,0 dB
  // Nepříznivá odchylka = kde měřená hodnota je POD referenční křivkou
  let optimalShift = -10; // Začneme nízko

  // Testujeme posuny od -10 do +80 dB a hledáme maximum, kde součet ≤ 32 dB
  for (let shift = -10; shift <= 80; shift++) {
    let sumUnfavorable = 0;

    // Spočítat součet nepříznivých odchylek pro tento posun
    sortedResults.forEach(result => {
      const refValue = REFERENCE_CURVE[result.frequency];
      if (refValue !== undefined) {
        const shiftedRef = refValue + shift;
        const deviation = shiftedRef - result.R;

        // Nepříznivá odchylka = kde referenční křivka je NAD měřením (měření je horší)
        if (deviation > 0) {
          sumUnfavorable += deviation;
        }
      }
    });

    // Pokud součet nepříznivých odchylek nepřekračuje 32,0 dB, tento posun je platný
    if (sumUnfavorable <= 32.0) {
      optimalShift = shift; // Ukládáme nejvyšší platný posun
    } else {
      // Jakmile překročíme 32 dB, vyšší posuny už nebudou platné
      break;
    }
  }

  // Vážená hodnota je hodnota referenční křivky na 500 Hz po posunu
  const weightedValue = REFERENCE_CURVE[500] + optimalShift;

  // Spočítat finální součet nepříznivých odchylek
  let finalUnfavorable = 0;
  sortedResults.forEach(result => {
    const refValue = REFERENCE_CURVE[result.frequency];
    if (refValue !== undefined) {
      const shiftedRef = refValue + optimalShift;
      const deviation = shiftedRef - result.R;
      if (deviation > 0) {
        finalUnfavorable += deviation;
      }
    }
  });

  // Výpočet adaptačních členů C a Ctr podle ISO 717-1
  // C - pro spektrum A (růžový hluk, např. obytné budovy)
  // Ctr - pro spektrum B (dopravní hluk s nízkými frekvencemi)

  // Spektrum A (100-3150 Hz) - normalizované na 0 dB
  const spectrumA: Record<number, number> = {
    100: -29.0, 125: -26.2, 160: -23.2, 200: -20.4, 250: -17.6,
    315: -14.9, 400: -12.4, 500: -10.0, 630: -7.8, 800: -5.6,
    1000: -3.6, 1250: -1.8, 1600: 0.0, 2000: 1.6, 2500: 3.0, 3150: 4.2
  };

  // Spektrum B (100-3150 Hz) - dopravní hluk - normalizované na 0 dB
  const spectrumB: Record<number, number> = {
    100: -14.1, 125: -10.8, 160: -7.7, 200: -4.9, 250: -2.5,
    315: -0.4, 400: 1.3, 500: 2.5, 630: 3.4, 800: 4.0,
    1000: 4.4, 1250: 4.5, 1600: 4.4, 2000: 4.2, 2500: 3.7, 3150: 3.0
  };

  // Funkce pro výpočet adaptačního členu
  const calculateAdaptationTerm = (spectrum: Record<number, number>): number => {
    // Pro každou frekvenci: Lspec = Lspectrum + R (nebo DnT)
    let sumPowers = 0;

    sortedResults.forEach(result => {
      const spectrumValue = spectrum[result.frequency];
      if (spectrumValue !== undefined) {
        // L = spektrum_hodnota - R (rozdíl hladin)
        const L = spectrumValue - result.R;
        sumPowers += Math.pow(10, L / 10);
      }
    });

    // LAi = 10 * log(suma) - energetický průměr
    const LAi = 10 * Math.log10(sumPowers);

    // Adaptační člen = LAi - R'w
    const adaptationTerm = LAi - weightedValue;

    // Zaokrouhlit na celé dB
    return Math.round(adaptationTerm);
  };

  const C = calculateAdaptationTerm(spectrumA);
  const Ctr = calculateAdaptationTerm(spectrumB);

  return {
    value: weightedValue,
    shift: optimalShift,
    unfavorableDeviations: finalUnfavorable,
    C,
    Ctr
  };
}

export default function SoundInsulationPage() {
  const [measurements, setMeasurements] = useState<FrequencyMeasurement[]>([]);
  const [roomParams, setRoomParams] = useState<RoomParameters | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [showParamsForm, setShowParamsForm] = useState(false);
  const [volume, setVolume] = useState<string>('');
  const [area, setArea] = useState<string>('');

  // Helper funkce pro parsování čísel s desetinnou čárkou i tečkou
  const parseNumber = (value: string): number => {
    if (!value) return 0;
    // Nahradit čárku tečkou pro parsování
    const normalized = value.replace(',', '.');
    return parseFloat(normalized);
  };

  const handleDataLoaded = (data: FrequencyMeasurement[], name: string) => {
    setMeasurements(data);
    setFileName(name);
    setShowParamsForm(true);
  };

  const handleParamsSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const volumeNum = parseNumber(volume);
    const areaNum = parseNumber(area);

    if (isNaN(volumeNum) || volumeNum <= 0) {
      alert('Zadejte platný objem přijímací místnosti (V > 0 m³)');
      return;
    }

    if (isNaN(areaNum) || areaNum <= 0) {
      alert('Zadejte platnou plochu měřené konstrukce (S > 0 m²)');
      return;
    }

    setRoomParams({ volume: volumeNum, area: areaNum });
    setShowParamsForm(false);
  };

  const handleReset = () => {
    setMeasurements([]);
    setRoomParams(null);
    setFileName('');
    setShowParamsForm(false);
    setVolume('');
    setArea('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                🔇 Neprůzvučnost
              </h1>
              <p className="mt-2 text-gray-600">
                Vyhodnocení vzduchové neprůzvučnosti podle ČSN EN ISO 16283-1
              </p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2"
            >
              ← Zpět na projekty
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {measurements.length === 0 ? (
          /* Upload Section */
          <div className="max-w-4xl mx-auto">
            <SoundInsulationFileUpload onDataLoaded={handleDataLoaded} />
          </div>
        ) : showParamsForm ? (
          /* Room Parameters Form */
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-center mb-6">
                <div className="text-5xl mb-4">📐</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Parametry přijímací místnosti
                </h2>
                <p className="text-gray-600">
                  Soubor "{fileName}" byl úspěšně načten ({measurements.length} frekvencí)
                </p>
              </div>

              <form onSubmit={handleParamsSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Objem přijímací místnosti V [m³] <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                    placeholder="např. 45,5 nebo 45.5"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-lg"
                    required
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Můžete použít desetinnou čárku (,) nebo tečku (.)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plocha měřené konstrukce S [m²] <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="např. 12,5 nebo 12.5"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-lg"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Můžete použít desetinnou čárku (,) nebo tečku (.)
                  </p>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2 text-sm">
                    ℹ️ Co jsou tyto parametry?
                  </h3>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>
                      <strong>Objem V:</strong> Celkový objem přijímací místnosti (délka × šířka × výška)
                    </li>
                    <li>
                      <strong>Plocha S:</strong> Plocha měřené konstrukce (např. stěny nebo stropu)
                    </li>
                  </ul>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    ← Zpět
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors font-medium"
                  >
                    Vypočítat výsledky →
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          /* Results Section */
          <div className="space-y-8">
            {/* File Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    📄 {fileName}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {measurements.length} frekvencí •
                    Objem: {roomParams?.volume} m³ •
                    Plocha: {roomParams?.area} m²
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  📁 Nahrát jiný soubor
                </button>
              </div>
            </div>

            {/* Chart */}
            <SoundInsulationChart
              measurements={measurements}
              roomParams={roomParams!}
            />

            {/* Results Table and Summary */}
            <SoundInsulationResults
              measurements={measurements}
              roomParams={roomParams!}
              fileName={fileName}
            />
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-blue-900 mb-4">
            ℹ️ O měření neprůzvučnosti
          </h2>
          <div className="space-y-3 text-sm text-blue-800">
            <p>
              <strong>Vzduchová neprůzvučnost</strong> charakterizuje schopnost stavební konstrukce
              (stěny, stropu, okna) bránit prostupu zvuku vzduchem mezi dvěma místnostmi.
            </p>

            <div className="bg-white rounded-lg p-4 mt-4">
              <h3 className="font-semibold text-blue-900 mb-2">📊 Měřené veličiny:</h3>
              <ul className="space-y-2 text-xs">
                <li>
                  <strong>L1</strong> - Hladina akustického tlaku ve vysílací místnosti [dB]
                </li>
                <li>
                  <strong>L2</strong> - Hladina akustického tlaku v přijímací místnosti [dB]
                </li>
                <li>
                  <strong>T</strong> - Doba dozvuku v přijímací místnosti [s]
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-4 mt-4">
              <h3 className="font-semibold text-blue-900 mb-2">🧮 Vypočtené veličiny:</h3>
              <ul className="space-y-2 text-xs">
                <li>
                  <strong>A</strong> - Ekvivalentní pohltivá plocha: A = 0.163 × V / T [m²]
                </li>
                <li>
                  <strong>R'</strong> - Stavební neprůzvučnost: R' = L1 - L2 + 10 × log(S/A) [dB]
                </li>
                <li>
                  <strong>DnT</strong> - Normovaný rozdíl hladin: DnT = L1 - L2 + 10 × log(T/0.5) [dB]
                </li>
                <li>
                  <strong>R'w</strong> - Vážená stavební neprůzvučnost (jednočíselná) [dB]
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-4 mt-4">
              <h3 className="font-semibold text-blue-900 mb-2">📚 Normy a předpisy:</h3>
              <ul className="text-xs space-y-1 list-disc list-inside">
                <li><strong>ČSN EN ISO 16283-1</strong> - Měření vzduchové neprůzvučnosti</li>
                <li><strong>ČSN EN ISO 717-1</strong> - Hodnocení zvukové izolace</li>
                <li><strong>ČSN 73 0532</strong> - Požadavky na zvukovou izolaci v budovách</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
