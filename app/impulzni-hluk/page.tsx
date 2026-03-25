'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ImpulseFileUpload from '@/components/ImpulseFileUpload';
import ImpulseInteractiveChart from '@/components/ImpulseInteractiveChart';
import ImpulseInfoBoxes from '@/components/ImpulseInfoBoxes';
import ImpulseTable from '@/components/ImpulseTable';

// Data z 1sekundového měření
export interface MeasurementData {
  timestamp: Date;
  lAeq: number;         // dB(A) - Ekvivalentní hladina
  lAImax: number;       // dB(A) - Maximum s Impulse charakteristikou
  lASmax: number;       // dB(A) - Maximum se Slow charakteristikou
}

// Identifikovaný impuls s korekcí na pozadí
export interface ImpulseData {
  timestamp: Date;
  lAeq: number;         // dB(A) - Ekvivalentní hladina impulzu (nekorigovaná)
  lAImax: number;       // dB(A) - Maximum s Impulse charakteristikou
  lASmax: number;       // dB(A) - Maximum se Slow charakteristikou
  difference: number;   // dB - Rozdíl LAImax - LASmax
  lAeqBefore: number;   // dB(A) - LAeq 1s před impulsem
  lAeqAfter: number;    // dB(A) - LAeq 1s po impulsu
  lAeqBackground: number; // dB(A) - Průměr pozadí (logaritmický)
  lAeqCorrected: number;  // dB(A) - LAeq korigovaný na pozadí
  isHighlyImpulsive: boolean; // LAImax - LASmax > 5 dB
  isDaytime: boolean;   // Je to ve dne (6:00-22:00)?
}

export default function ImpulseNoisePage() {
  const [data, setData] = useState<ImpulseData[]>([]);
  const [allMeasurements, setAllMeasurements] = useState<MeasurementData[]>([]);
  const [fileName, setFileName] = useState<string>('');

  // Try to load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('impulzni-hluk-state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.data && Array.isArray(parsed.data)) {
          setData(parsed.data.map((d: any) => ({
            ...d,
            timestamp: new Date(d.timestamp),
          })));
          setFileName(parsed.fileName || '');
        }
        if (parsed.allMeasurements && Array.isArray(parsed.allMeasurements)) {
          setAllMeasurements(parsed.allMeasurements.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          })));
        }
      }
    } catch (e) {
      console.error('Failed to load from localStorage:', e);
      // Clear corrupted data
      localStorage.removeItem('impulzni-hluk-state');
    }
  }, []);

  // Try to save to localStorage when data changes
  useEffect(() => {
    if (data.length === 0) return;

    try {
      const toSave = {
        data: data.map(d => ({
          ...d,
          timestamp: d.timestamp.toISOString(),
        })),
        allMeasurements: allMeasurements.map(m => ({
          ...m,
          timestamp: m.timestamp.toISOString(),
        })),
        fileName,
      };
      localStorage.setItem('impulzni-hluk-state', JSON.stringify(toSave));
    } catch (e) {
      if (e instanceof Error && e.name === 'QuotaExceededError') {
        console.warn('LocalStorage quota exceeded - data will not persist after page refresh');
        // Don't show alert here, it's annoying during file processing
      } else {
        console.error('Failed to save to localStorage:', e);
      }
    }
  }, [data, allMeasurements, fileName]);

  const handleDataLoaded = (impulses: ImpulseData[], measurements: MeasurementData[], newFileName: string) => {
    setData(impulses);
    setAllMeasurements(measurements);
    setFileName(newFileName);
  };

  const handleClearData = () => {
    if (confirm('Opravdu chcete smazat všechna data?')) {
      setData([]);
      setAllMeasurements([]);
      setFileName('');
      localStorage.removeItem('impulzni-hluk-state');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-blue-600 hover:text-blue-700 transition-colors"
              >
                ← Zpět
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                  💥 Vysoce impulsní hluk
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Analýza podle NV 272/2011 Sb. - Příloha č. 4
                </p>
              </div>
            </div>
            {data.length > 0 && (
              <button
                onClick={handleClearData}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                🗑️ Smazat data
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* File Upload */}
        {data.length === 0 ? (
          <div className="mb-8">
            <ImpulseFileUpload onDataLoaded={handleDataLoaded} />
          </div>
        ) : (
          <>
            {/* File Info */}
            <div className="mb-6 bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    📄 {fileName}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {data.length} impulzů • {data.filter(d => d.isHighlyImpulsive).length} vysoce impulsních
                  </p>
                </div>
                <button
                  onClick={() => {
                    setData([]);
                    setAllMeasurements([]);
                    setFileName('');
                    localStorage.removeItem('impulzni-hluk-state');
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  📁 Nahrát jiný soubor
                </button>
              </div>
            </div>

            {/* Chart */}
            <div className="mb-8">
              <ImpulseInteractiveChart data={allMeasurements} impulses={data} />
            </div>

            {/* Info Boxes */}
            <div className="mb-8">
              <ImpulseInfoBoxes impulseData={data} allMeasurements={allMeasurements} />
            </div>

            {/* Data Table */}
            <div className="mb-8">
              <ImpulseTable data={data} />
            </div>
          </>
        )}

        {/* Info Section */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-blue-900 mb-4">
            ℹ️ O vysoce impulsním hluku (NV 272/2011 Sb.)
          </h2>
          <div className="space-y-3 text-sm text-blue-800">
            <p>
              <strong>Vysoce impulsní hluk</strong> vzniká při střelbě z lehkých zbraní, explozích výbušnin
              s hmotností pod 25 g TNT ekvivalentu a vzájemném nárazu pevných těles.
            </p>

            <div className="bg-white rounded-lg p-4 mt-4">
              <h3 className="font-semibold text-blue-900 mb-2">📊 Identifikace vysoce impulsního hluku:</h3>
              <div className="space-y-2">
                <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                  LAImax - LASmax {'>'} 5 dB
                </p>
                <p className="text-xs text-gray-600">
                  Pokud je rozdíl větší než 5 dB, hluk je považován za vysoce impulsní a
                  aplikuje se korekce <strong>-12 dB</strong> pro hygienické limity.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 mt-4">
              <h3 className="font-semibold text-blue-900 mb-2">📊 Měřené veličiny:</h3>
              <ul className="space-y-2">
                <li>
                  <strong>LAImax</strong> - Maximum s Impulse charakteristikou [dB(A)]
                  <br />
                  <span className="text-xs text-gray-600">
                    Časová konstanta: 35 ms vzestup, 1500 ms pokles
                  </span>
                </li>
                <li>
                  <strong>LASmax</strong> - Maximum se Slow charakteristikou [dB(A)]
                  <br />
                  <span className="text-xs text-gray-600">
                    Časová konstanta: 1000 ms vzestup i pokles
                  </span>
                </li>
                <li>
                  <strong>LAeq</strong> - Ekvivalentní hladina impulzu [dB(A)]
                  <br />
                  <span className="text-xs text-gray-600">
                    Korigovaná na zbytkový hluk (pozadí před a po impulsu)
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-4 mt-4">
              <h3 className="font-semibold text-blue-900 mb-2">🔬 Korekce na pozadí:</h3>
              <p className="text-xs text-gray-700 mb-2">
                LAeq impulzu musí být korigován na zbytkový hluk:
              </p>
              <ul className="text-xs space-y-1 list-disc list-inside">
                <li>Změř pozadí 1 sekundu PŘED impulsem</li>
                <li>Změř pozadí 1 sekundu PO impulsu</li>
                <li>Vypočti logaritmický průměr pozadí</li>
                <li>Odečti energeticky od LAeq impulzu</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-4 mt-4">
              <h3 className="font-semibold text-blue-900 mb-2">📁 Formát souboru:</h3>
              <p className="text-xs text-gray-700">
                Excel/CSV soubor s těmito sloupci:
              </p>
              <ul className="text-xs mt-2 space-y-1">
                <li>• <strong>Datum a čas</strong> - Časové razítko impulzu</li>
                <li>• <strong>LAImax</strong> - Maximum Impulse [dB(A)] - <span className="text-red-600">Povinné</span></li>
                <li>• <strong>LASmax</strong> - Maximum Slow [dB(A)] - <span className="text-red-600">Povinné</span></li>
                <li>• <strong>LAeq</strong> - Ekvivalentní hladina [dB(A)] - <span className="text-red-600">Povinné</span></li>
                <li>• <strong>Pozadí před</strong> (volitelné) - Pozadí 1s před [dB(A)]</li>
                <li>• <strong>Pozadí po</strong> (volitelné) - Pozadí 1s po [dB(A)]</li>
                <li>• <strong>Délka</strong> (volitelné) - Délka impulzu [ms]</li>
                <li>• <strong>Zdroj</strong> (volitelné) - Popis zdroje</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
