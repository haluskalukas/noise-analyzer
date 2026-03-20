'use client';

import { useState, useMemo } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { NoiseChart } from '@/components/NoiseChart';
import { Statistics } from '@/components/Statistics';
import { NoiseData, TimeFilter, NoiseDataPoint, NoiseStats, HourlyAvg } from '@/types';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';

// Helper functions for statistics calculation
function calculateLogAverage(values: number[]): number {
  if (values.length === 0) return 0;
  const sumOfPowers = values.reduce((sum, db) => sum + Math.pow(10, db / 10), 0);
  const average = sumOfPowers / values.length;
  return 10 * Math.log10(average);
}

function getAcousticPercentile(sortedValues: number[], acousticPercentile: number): number {
  const statisticalPercentile = 1 - (acousticPercentile / 100);
  const index = Math.floor(sortedValues.length * statisticalPercentile);
  return sortedValues[Math.min(index, sortedValues.length - 1)];
}

function calculateStats(points: NoiseDataPoint[]): NoiseStats {
  const values = points.map(p => p.value).sort((a, b) => a - b);

  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = calculateLogAverage(points.map(p => p.value));
  const median = values[Math.floor(values.length / 2)];
  const p10 = getAcousticPercentile(values, 10);
  const p90 = getAcousticPercentile(values, 90);

  const dayPoints = points.filter(p => p.hour >= 6 && p.hour < 22);
  const nightPoints = points.filter(p => p.hour < 6 || p.hour >= 22);

  const dayAvg = dayPoints.length > 0 ? calculateLogAverage(dayPoints.map(p => p.value)) : 0;
  const nightAvg = nightPoints.length > 0 ? calculateLogAverage(nightPoints.map(p => p.value)) : 0;

  const hourlyAvgs: HourlyAvg[] = [];
  for (let hour = 0; hour < 24; hour++) {
    const hourPoints = points.filter(p => p.hour === hour);

    if (hourPoints.length > 0) {
      const hourValues = hourPoints.map(p => p.value).sort((a, b) => a - b);

      hourlyAvgs.push({
        hour,
        avg: calculateLogAverage(hourPoints.map(p => p.value)),
        min: Math.min(...hourValues),
        max: Math.max(...hourValues),
        count: hourPoints.length,
        p5: getAcousticPercentile(hourValues, 5),
        p10: getAcousticPercentile(hourValues, 10),
        p90: getAcousticPercentile(hourValues, 90),
        p95: getAcousticPercentile(hourValues, 95),
      });
    }
  }

  return { min, max, avg, median, p10, p90, dayAvg, nightAvg, hourlyAvgs };
}

export default function Home() {
  const [noiseData, setNoiseData] = useState<NoiseData | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>({ type: 'all' });
  const [activeTab, setActiveTab] = useState<'chart' | 'stats'>('chart');
  const [deletedIndices, setDeletedIndices] = useState<Set<number>>(new Set());

  // Recalculate statistics when data is deleted
  const currentStats = useMemo(() => {
    if (!noiseData) return null;

    // Filter out deleted points
    const activePoints = noiseData.points.filter((_, index) => !deletedIndices.has(index));

    if (activePoints.length === 0) return noiseData.stats;

    // Recalculate stats with active points
    const recalculated = calculateStats(activePoints);

    console.log('Stats recalculated:', {
      totalPoints: noiseData.points.length,
      deletedCount: deletedIndices.size,
      activePoints: activePoints.length,
      originalAvg: noiseData.stats.avg.toFixed(1),
      newAvg: recalculated.avg.toFixed(1)
    });

    return recalculated;
  }, [noiseData, deletedIndices]);

  const handleDataLoaded = (data: NoiseData) => {
    setNoiseData(data);
    setTimeFilter({ type: 'all' });
    setDeletedIndices(new Set());
  };

  const handleReset = () => {
    setNoiseData(null);
    setTimeFilter({ type: 'all' });
    setActiveTab('chart');
    setDeletedIndices(new Set());
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            📊 Analyzátor hluku
          </h1>
          <p className="mt-2 text-gray-600">
            Interaktivní analýza měření hladiny hluku z Excel souborů
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!noiseData ? (
          /* Upload Section */
          <div className="max-w-3xl mx-auto">
            <FileUpload onDataLoaded={handleDataLoaded} />
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
                  {format(noiseData.date, 'PPP', { locale: cs })} • {noiseData.points.length} měření
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

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  <TabButton
                    active={activeTab === 'chart'}
                    onClick={() => setActiveTab('chart')}
                    label="📈 Graf"
                  />
                  <TabButton
                    active={activeTab === 'stats'}
                    onClick={() => setActiveTab('stats')}
                    label="📊 Statistiky"
                  />
                </nav>
              </div>

              <div className="p-6">
                {activeTab === 'chart' && (
                  <NoiseChart
                    data={noiseData.points}
                    filter={timeFilter}
                    showAverage={true}
                    deletedIndices={deletedIndices}
                    onDeletedIndicesChange={setDeletedIndices}
                  />
                )}
                {activeTab === 'stats' && (
                  <Statistics stats={currentStats || noiseData.stats} />
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 text-center text-sm text-gray-500">
        <p>Analyzátor hluku • Vytvořeno s Next.js, Recharts a TypeScript</p>
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

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
        active
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      {label}
    </button>
  );
}
