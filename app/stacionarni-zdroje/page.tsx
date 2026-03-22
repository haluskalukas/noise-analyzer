'use client';

import { useState } from 'react';
import Link from 'next/link';
import { StationaryFileUpload } from '@/components/StationaryFileUpload';
import { StationaryChart } from '@/components/StationaryChart';
import { StationarySourceTable } from '@/components/StationarySourceTable';
import { StationaryData, StationaryDataPoint, StationarySource } from '@/types/stationary';
import { calculateStationaryStats } from '@/lib/stationaryCalculations';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';

export default function StacionarniZdroje() {
  const [stationaryData, setStationaryData] = useState<StationaryData | null>(null);
  const [sources, setSources] = useState<StationarySource[]>([]);

  const handleDataLoaded = (data: StationaryData) => {
    setStationaryData(data);
    setSources([]);
  };

  const handleReset = () => {
    setStationaryData(null);
    setSources([]);
  };

  const handleAddSource = (startIdx: number, endIdx: number, points: StationaryDataPoint[]) => {
    if (!stationaryData) return;

    const selectedPoints = points.slice(startIdx, endIdx + 1);
    if (selectedPoints.length === 0) return;

    const stats = calculateStationaryStats(selectedPoints);

    const startTime = selectedPoints[0].datetime;
    const endTime = selectedPoints[selectedPoints.length - 1].datetime;

    const hasSource = sources.some(s => s.type === 'source');

    const type: 'source' | 'background' = !hasSource ? 'source' : 'background';
    const defaultName = type === 'source' ? 'Zdroj hluku' : 'Hluk pozadí';

    const timestamp = new Date().getTime();
    const newSource: StationarySource = {
      id: \`source-\${timestamp}\`,
      name: defaultName,
      type,
      startTime,
      endTime,
      laeq: stats.laeq,
      l5: stats.l5,
      l10: stats.l10,
      l50: stats.l50,
      l90: stats.l90,
      l95: stats.l95,
      min: stats.min,
      max: stats.max,
      avgFrequencies: stats.avgFrequencies,
      startIndex: startIdx,
      endIndex: endIdx,
    };

    setSources(prev => [...prev, newSource]);
  };

  const handleUpdateSource = (id: string, field: keyof StationarySource, value: string) => {
    setSources(prev => prev.map(source =>
      source.id === id ? { ...source, [field]: value } : source
    ));
  };

  const handleDeleteSource = (id: string) => {
    setSources(prev => prev.filter(source => source.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🏭 Stacionární zdroje hluku
              </h1>
              <p className="mt-2 text-gray-600">
                Analýza měření hluku ze stacionárních zdrojů
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
        {!stationaryData ? (
          <div className="max-w-3xl mx-auto">
            <StationaryFileUpload onDataLoaded={handleDataLoaded} />

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
                💡 Jak používat tento modul
              </h3>
              <div className="text-xs text-blue-800 space-y-2">
                <p>1. Nahraj Excel soubor s měřeními (datum, čas, LAeq, 31 frekvencí 20 Hz - 20 kHz)</p>
                <p>2. V grafu pomocí <strong>Alt + tažení myší</strong> vyber interval pro ZDROJ HLUKU</p>
                <p>3. Znovu vyber interval pro HLUK POZADÍ (druhý výběr)</p>
                <p>4. Automaticky se vypočítá LAeq, percentily a frekvenční spektrum</p>
                <p>5. Do tabulky můžeš upravit názvy měření</p>
                <p>6. V detailu uvidíš sloupcový graf se srovnáním zdroje a pozadí</p>
                <p>7. Exportuj výsledky do Excelu nebo graf jako PNG</p>
              </div>
            </div>

            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-6">
              <h3 className="text-sm font-medium text-amber-900 mb-2 flex items-center gap-2">
                📊 Co aplikace počítá
              </h3>
              <div className="text-xs text-amber-800 space-y-2">
                <p><strong>LAeq</strong> - Ekvivalentní hladina hluku A (logaritmický průměr)</p>
                <p><strong>Percentily</strong> - L5, L10, L50, L90, L95 (akustická notace)</p>
                <p><strong>Frekvenční spektrum</strong> - Průměrné hodnoty pro všech 31 frekvencí (1/3 oktávy)</p>
                <p><strong>Min/Max</strong> - Minimální a maximální hodnoty za interval</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {stationaryData.filename}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {format(stationaryData.date, 'PPP', { locale: cs })} • {stationaryData.points.length} měření • {sources.length} zdrojů
                </p>
              </div>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
              >
                Nahrát jiný soubor
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Graf měření - výběr intervalů (zdroj + pozadí)
              </h3>
              <StationaryChart
                data={stationaryData.points}
                onSourceSelection={handleAddSource}
              />
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <StationarySourceTable
                sources={sources}
                onUpdateSource={handleUpdateSource}
                onDeleteSource={handleDeleteSource}
              />
            </div>
          </div>
        )}
      </main>

      <footer className="mt-12 py-6 text-center text-sm text-gray-500">
        <p>Stacionární zdroje hluku • Vytvořeno s Next.js a TypeScript</p>
      </footer>
    </div>
  );
}
