'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileUpload } from '@/components/FileUpload';
import { NoiseChart } from '@/components/NoiseChart';
import { TrainTable } from '@/components/TrainTable';
import { TrainCalculations } from '@/components/TrainCalculations';
import { NoiseData, TimeFilter, NoiseDataPoint } from '@/types';
import { Train } from '@/types/train';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';

const STORAGE_KEY = 'zeleznicni-doprava-hluk-state';

export default function ZeleznicniDopravaHluk() {
  const [noiseData, setNoiseData] = useState<NoiseData | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>({ type: 'all' });
  const [trains, setTrains] = useState<Train[]>([]);
  const [deletedIndices, setDeletedIndices] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<'trains' | 'calculations'>('trains');
  const [userInputs, setUserInputs] = useState<Map<string, { pocetVlakuDen: number; pocetVlakuNoc: number }>>(new Map());

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

        if (parsed.trains) {
          // Restore trains with Date objects
          const restoredTrains = parsed.trains.map((t: any) => ({
            ...t,
            startTime: new Date(t.startTime),
            endTime: new Date(t.endTime),
          }));
          setTrains(restoredTrains);
        }
        if (parsed.userInputs) {
          setUserInputs(new Map(Object.entries(parsed.userInputs)));
        }
        if (parsed.activeTab) {
          setActiveTab(parsed.activeTab);
        }
        if (parsed.timeFilter) {
          setTimeFilter(parsed.timeFilter);
        }
        if (parsed.deletedIndices) {
          setDeletedIndices(new Set(parsed.deletedIndices));
        }
      }
    } catch (error) {
      console.error('Error loading saved state:', error);
    }
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (noiseData || trains.length > 0 || userInputs.size > 0) {
      try {
        const toSave = {
          noiseData,
          trains,
          userInputs: Object.fromEntries(userInputs),
          activeTab,
          timeFilter,
          deletedIndices: Array.from(deletedIndices),
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      } catch (error) {
        console.error('Error saving state:', error);
      }
    }
  }, [noiseData, trains, userInputs, activeTab, timeFilter, deletedIndices]);

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
    setActiveTab('trains');
    setUserInputs(new Map());
    localStorage.removeItem(STORAGE_KEY);
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

  const handleSaveProject = () => {
    const projectName = prompt('Zadej název projektu:');
    if (!projectName || !projectName.trim()) return;

    try {
      const savedProjects = JSON.parse(localStorage.getItem('zeleznicni-doprava-projekty') || '[]');

      // Create lightweight project data - only save essential info, not raw noiseData
      const projectData = {
        id: `project-${Date.now()}`,
        name: projectName.trim(),
        timestamp: new Date().toISOString(),
        data: {
          // Save only metadata from noiseData, not all the points
          noiseMetadata: noiseData ? {
            filename: noiseData.filename,
            date: noiseData.date,
            pointsCount: noiseData.points.length,
          } : null,
          trains,
          userInputs: Object.fromEntries(userInputs),
          activeTab,
          timeFilter,
          deletedIndices: Array.from(deletedIndices),
        },
      };
      savedProjects.push(projectData);
      localStorage.setItem('zeleznicni-doprava-projekty', JSON.stringify(savedProjects));
      alert(`Projekt "${projectName}" byl úspěšně uložen!\n\nPoznámka: Graf nebude dostupný, ale všechny vlaky a výpočty jsou uložené.`);
    } catch (error) {
      console.error('Error saving project:', error);
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        alert('Nepodařilo se uložit projekt - nedostatek místa v prohlížeči.\n\nZkus smazat některé staré projekty.');
      } else {
        alert('Nepodařilo se uložit projekt.');
      }
    }
  };

  const handleLoadProject = (projectId: string) => {
    try {
      const savedProjects = JSON.parse(localStorage.getItem('zeleznicni-doprava-projekty') || '[]');
      const project = savedProjects.find((p: any) => p.id === projectId);
      if (!project) return;

      const data = project.data;

      // Create mock noiseData from metadata so the UI works
      if (data.noiseMetadata) {
        const mockData: NoiseData = {
          filename: data.noiseMetadata.filename,
          date: new Date(data.noiseMetadata.date),
          points: [], // Empty - graph won't work but that's ok
          stats: {
            min: 0,
            max: 0,
            avg: 0,
            median: 0,
            p10: 0,
            p90: 0,
            dayAvg: null,
            nightAvg: null,
            hourlyAvgs: [],
          },
        };
        setNoiseData(mockData);
      }

      // Restore trains
      if (data.trains) {
        const restoredTrains = data.trains.map((t: any) => ({
          ...t,
          startTime: new Date(t.startTime),
          endTime: new Date(t.endTime),
        }));
        setTrains(restoredTrains);
      }

      // Restore other state
      if (data.userInputs) {
        setUserInputs(new Map(Object.entries(data.userInputs)));
      }
      if (data.activeTab) {
        setActiveTab(data.activeTab);
      }
      if (data.timeFilter) {
        setTimeFilter(data.timeFilter);
      }
      if (data.deletedIndices) {
        setDeletedIndices(new Set(data.deletedIndices));
      }

      alert(`Projekt "${project.name}" byl načten!\n\nGraf není dostupný (data nebyla uložena), ale všechny vlaky a výpočty jsou k dispozici.`);
    } catch (error) {
      console.error('Error loading project:', error);
      alert('Nepodařilo se načíst projekt.');
    }
  };

  const handleDeleteProject = (projectId: string) => {
    try {
      const savedProjects = JSON.parse(localStorage.getItem('zeleznicni-doprava-projekty') || '[]');
      const project = savedProjects.find((p: any) => p.id === projectId);
      if (!project) return;

      if (!confirm(`Opravdu chceš smazat projekt "${project.name}"?`)) return;

      const filtered = savedProjects.filter((p: any) => p.id !== projectId);
      localStorage.setItem('zeleznicni-doprava-projekty', JSON.stringify(filtered));
      alert(`Projekt "${project.name}" byl smazán.`);
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Nepodařilo se smazat projekt.');
    }
  };

  const [savedProjects, setSavedProjects] = useState<any[]>([]);
  const [showProjectsModal, setShowProjectsModal] = useState(false);

  useEffect(() => {
    try {
      const projects = JSON.parse(localStorage.getItem('zeleznicni-doprava-projekty') || '[]');
      setSavedProjects(projects);
    } catch (error) {
      console.error('Error loading projects list:', error);
    }
  }, [showProjectsModal]);

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

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  <TabButton
                    active={activeTab === 'trains'}
                    onClick={() => setActiveTab('trains')}
                    label="🚂 Seznam vlaků"
                  />
                  <TabButton
                    active={activeTab === 'calculations'}
                    onClick={() => setActiveTab('calculations')}
                    label="📊 Dopočet"
                  />
                </nav>
              </div>

              <div className="p-6">
                {activeTab === 'trains' && (
                  <TrainTable
                    trains={trains}
                    onUpdateTrain={handleUpdateTrain}
                    onDeleteTrain={handleDeleteTrain}
                  />
                )}
                {activeTab === 'calculations' && (
                  <TrainCalculations
                    trains={trains}
                    userInputs={userInputs}
                    onUserInputsChange={setUserInputs}
                  />
                )}
              </div>
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
