'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { FileUpload } from '@/components/FileUpload';
import { NoiseChart } from '@/components/NoiseChart';
import { Statistics } from '@/components/Statistics';
import { NoiseData, TimeFilter, NoiseDataPoint, NoiseStats, HourlyAvg } from '@/types';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';

const STORAGE_KEY = 'automobilova-doprava-state';

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

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);

        // Restore noiseData if available
        if (parsed.noiseData) {
          const restoredData = {
            ...parsed.noiseData,
            date: new Date(parsed.noiseData.date),
            points: parsed.noiseData.points.map((p: any) => ({
              ...p,
              datetime: new Date(p.datetime),
            })),
          };
          setNoiseData(restoredData);
        }

        if (parsed.deletedIndices) {
          setDeletedIndices(new Set(parsed.deletedIndices));
        }
        if (parsed.timeFilter) {
          setTimeFilter(parsed.timeFilter);
        }
        if (parsed.activeTab) {
          setActiveTab(parsed.activeTab);
        }
      }
    } catch (error) {
      console.error('Error loading saved state:', error);
    }
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (noiseData) {
      try {
        const toSave = {
          noiseData,
          deletedIndices: Array.from(deletedIndices),
          timeFilter,
          activeTab,
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      } catch (error) {
        console.error('Error saving state:', error);
      }
    }
  }, [noiseData, deletedIndices, timeFilter, activeTab]);

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
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleSaveProject = () => {
    const projectName = prompt('Zadej název projektu:');
    if (!projectName || !projectName.trim()) return;

    try {
      const savedProjects = JSON.parse(localStorage.getItem('automobilova-doprava-projekty') || '[]');
      const projectData = {
        id: `project-${Date.now()}`,
        name: projectName.trim(),
        timestamp: new Date().toISOString(),
        data: {
          noiseData,
          deletedIndices: Array.from(deletedIndices),
          timeFilter,
          activeTab,
        },
      };
      savedProjects.push(projectData);
      localStorage.setItem('automobilova-doprava-projekty', JSON.stringify(savedProjects));
      alert(`Projekt "${projectName}" byl úspěšně uložen!`);
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Nepodařilo se uložit projekt.');
    }
  };

  const handleLoadProject = (projectId: string) => {
    try {
      const savedProjects = JSON.parse(localStorage.getItem('automobilova-doprava-projekty') || '[]');
      const project = savedProjects.find((p: any) => p.id === projectId);
      if (!project) return;

      const data = project.data;

      // Restore noiseData
      if (data.noiseData) {
        const restoredData = {
          ...data.noiseData,
          date: new Date(data.noiseData.date),
          points: data.noiseData.points.map((p: any) => ({
            ...p,
            datetime: new Date(p.datetime),
          })),
        };
        setNoiseData(restoredData);
      }

      // Restore other state
      if (data.deletedIndices) {
        setDeletedIndices(new Set(data.deletedIndices));
      }
      if (data.timeFilter) {
        setTimeFilter(data.timeFilter);
      }
      if (data.activeTab) {
        setActiveTab(data.activeTab);
      }

      alert(`Projekt "${project.name}" byl načten!`);
    } catch (error) {
      console.error('Error loading project:', error);
      alert('Nepodařilo se načíst projekt.');
    }
  };

  const handleDeleteProject = (projectId: string) => {
    try {
      const savedProjects = JSON.parse(localStorage.getItem('automobilova-doprava-projekty') || '[]');
      const project = savedProjects.find((p: any) => p.id === projectId);
      if (!project) return;

      if (!confirm(`Opravdu chceš smazat projekt "${project.name}"?`)) return;

      const filtered = savedProjects.filter((p: any) => p.id !== projectId);
      localStorage.setItem('automobilova-doprava-projekty', JSON.stringify(filtered));
      alert(`Projekt "${project.name}" byl smazán.`);
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Nepodařilo se smazat projekt.');
    }
  };

  const [savedProjects, setSavedProjects] = useState<any[]>([]);

  useEffect(() => {
    try {
      const projects = JSON.parse(localStorage.getItem('automobilova-doprava-projekty') || '[]');
      setSavedProjects(projects);
    } catch (error) {
      console.error('Error loading projects list:', error);
    }
  }, [noiseData]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🚗 Automobilová doprava
              </h1>
              <p className="mt-2 text-gray-600">
                Analýza měření hladiny hluku z automobilové dopravy
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

            {/* Saved Projects Section */}
            {savedProjects.length > 0 && (
              <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-sm font-medium text-green-900 mb-3 flex items-center gap-2">
                  💾 Uložené projekty
                </h3>
                <div className="space-y-2">
                  {savedProjects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{project.name}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(project.timestamp).toLocaleString('cs-CZ')}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleLoadProject(project.id)}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                        >
                          Načíst
                        </button>
                        <button
                          onClick={() => {
                            handleDeleteProject(project.id);
                            setSavedProjects(prev => prev.filter(p => p.id !== project.id));
                          }}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                        >
                          Smazat
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
              <div className="flex gap-3">
                <button
                  onClick={handleSaveProject}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors flex items-center gap-2 shadow-sm"
                >
                  💾 Uložit projekt
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                >
                  Nahrát jiný soubor
                </button>
              </div>
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
