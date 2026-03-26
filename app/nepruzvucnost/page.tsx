'use client';

import { useState } from 'react';
import Link from 'next/link';
import SoundInsulationFileUpload from '@/components/SoundInsulationFileUpload';
import SoundInsulationChart from '@/components/SoundInsulationChart';
import SoundInsulationResults from '@/components/SoundInsulationResults';

// Standardní tercové frekvence pro stavební akustiku (50 Hz - 5000 Hz)
export const STANDARD_FREQUENCIES = [
  50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000,
  1250, 1600, 2000, 2500, 3150, 4000, 5000
];

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

export default function SoundInsulationPage() {
  const [measurements, setMeasurements] = useState<FrequencyMeasurement[]>([]);
  const [roomParams, setRoomParams] = useState<RoomParameters | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const handleDataLoaded = (
    data: FrequencyMeasurement[],
    params: RoomParameters,
    name: string
  ) => {
    setMeasurements(data);
    setRoomParams(params);
    setFileName(name);
  };

  const handleReset = () => {
    setMeasurements([]);
    setRoomParams(null);
    setFileName('');
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
