'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileUpload } from '@/components/FileUpload';
import { NoiseChart } from '@/components/NoiseChart';
import { TrainTable } from '@/components/TrainTable';
import { NoiseData, TimeFilter, NoiseDataPoint } from '@/types';
import { Train } from '@/types/train';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';

export default function ZeleznicniDopravaHluk() {
  const [noiseData, setNoiseData] = useState<NoiseData | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>({ type: 'all' });
  const [trains, setTrains] = useState<Train[]>([]);
  const [deletedIndices, setDeletedIndices] = useState<Set<number>>(new Set());

  const handleDataLoaded = (data: NoiseData) => {
    setNoiseData(data);
    setTimeFilter({ type: 'all' });
    setTrains([]);
    setDeletedIndices(new Set());
  };

  const handleReset = () => {
    setNoiseData(null);
    setTimeFilter({ type: 'all' });
    setTrains([]);
    setDeletedIndices(new Set());
  };

  const handleAddTrain = (startIdx: number, endIdx: number, points: NoiseDataPoint[]) => {
    if (!noiseData) return;

    // Get selected interval
    const selectedPoints = points.slice(startIdx, endIdx + 1);
    if (selectedPoints.length === 0) return;

    // Calculate LAeq (logarithmic average)
    const sumOfPowers = selectedPoints.reduce((sum, p) => sum + Math.pow(10, p.value / 10), 0);
    const laeq = 10 * Math.log10(sumOfPowers / selectedPoints.length);

    // Calculate duration in seconds
    const startTime = selectedPoints[0].datetime;
    const endTime = selectedPoints[selectedPoints.length - 1].datetime;
    const durationSeconds = (endTime.getTime() - startTime.getTime()) / 1000;

    // Calculate LAE: 10 * LOG10(10^(LAeq/10) * duration)
    const lae = 10 * Math.log10(Math.pow(10, laeq / 10) * durationSeconds);

    const newTrain: Train = {
      id: `train-${Date.now()}`,
      startTime,
      endTime,
      trakce: '',
      druhVlaku: '',
      pocetVozu: '',
      smer: '',
      laeq,
      casPrujezdu: durationSeconds,
      lae,
      startIndex: startIdx,
      endIndex: endIdx,
    };

    setTrains(prev => [...prev, newTrain]);
  };

  const handleUpdateTrain = (id: string, field: keyof Train, value: string) => {
    setTrains(prev => prev.map(train =>
      train.id === id ? { ...train, [field]: value } : train
    ));
  };

  const handleDeleteTrain = (id: string) => {
    setTrains(prev => prev.filter(train => train.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🚂 Železniční doprava - hluk
              </h1>
              <p className="mt-2 text-gray-600">
                Analýza měření hluku z průjezdů vlaků
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
        {!noiseData ? (
          /* Upload Section */
          <div className="max-w-3xl mx-auto">
            <FileUpload onDataLoaded={handleDataLoaded} />

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
                💡 Jak používat tento modul
              </h3>
              <div className="text-xs text-blue-800 space-y-2">
                <p>1. Nahraj Excel soubor s měřeními hluku (stejný formát jako u automobilové dopravy)</p>
                <p>2. V grafu pomocí <strong>Alt + tažení myší</strong> vyber interval průjezdu vlaku</p>
                <p>3. Automaticky se vypočítá L<sub>Aeq</sub>, čas průjezdu a L<sub>AE</sub></p>
                <p>4. Do tabulky doplň údaje o vlaku (trakce, druh, počet vozů, směr)</p>
                <p>5. Exportuj výsledky do Excelu</p>
              </div>
            </div>
          </div>
        ) : (
          /* Analysis Section */
          <div className="space-y-6">
            {/* Data Info & Reset */}
            <div className="bg-white rounded-lg shadow-sm p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {noiseData.filename}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {format(noiseData.date, 'PPP', { locale: cs })} • {noiseData.points.length} měření • {trains.length} vlaků
                </p>
              </div>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
              >
                Nahrát jiný soubor
              </button>
            </div>

            {/* Time Filter */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Časový filtr
              </h3>
              <div className="flex flex-wrap gap-3">
                <FilterButton
                  active={timeFilter.type === 'all'}
                  onClick={() => setTimeFilter({ type: 'all' })}
                  icon="🌍"
                  label="Celý den"
                />
                <FilterButton
                  active={timeFilter.type === 'day'}
                  onClick={() => setTimeFilter({ type: 'day' })}
                  icon="☀️"
                  label="Den (6:00-22:00)"
                />
                <FilterButton
                  active={timeFilter.type === 'night'}
                  onClick={() => setTimeFilter({ type: 'night' })}
                  icon="🌙"
                  label="Noc (22:00-6:00)"
                />
              </div>
            </div>

            {/* Graph */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Graf měření - výběr průjezdů vlaků
              </h3>
              <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>💡 Tip:</strong> Drž <kbd className="px-2 py-1 bg-white rounded border border-blue-300 font-mono text-xs">Alt/Option</kbd> a táhni myší v grafu pro výběr průjezdu vlaku. Po uvolnění se vlak automaticky přidá do tabulky.
                </p>
              </div>
              <NoiseChart
                data={noiseData.points}
                filter={timeFilter}
                showAverage={false}
                deletedIndices={deletedIndices}
                onDeletedIndicesChange={setDeletedIndices}
                onTrainSelection={handleAddTrain}
              />
            </div>

            {/* Train Table */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <TrainTable
                trains={trains}
                onUpdateTrain={handleUpdateTrain}
                onDeleteTrain={handleDeleteTrain}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 text-center text-sm text-gray-500">
        <p>Železniční doprava - hluk • Vytvořeno s Next.js a TypeScript</p>
      </footer>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-md font-medium transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      <span className="mr-2">{icon}</span>
      {label}
    </button>
  );
}
