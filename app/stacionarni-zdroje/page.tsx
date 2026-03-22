'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { StationaryFileUpload } from '@/components/StationaryFileUpload';
import { StationaryChart } from '@/components/StationaryChart';
import { StationarySourceTable } from '@/components/StationarySourceTable';
import { StationaryCalculations } from '@/components/StationaryCalculations';
import { SourceTypeDialog } from '@/components/SourceTypeDialog';
import { StationaryData, StationaryDataPoint, StationarySource, STATIONARY_FREQUENCY_LIST } from '@/types/stationary';
import { calculateStationaryStats, detectTonalComponents } from '@/lib/stationaryCalculations';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';

const STORAGE_KEY = 'stacionarni-zdroje-state';

export default function StacionarniZdroje() {
  const [stationaryData, setStationaryData] = useState<StationaryData | null>(null);
  const [sources, setSources] = useState<StationarySource[]>([]);
  const [pendingSelection, setPendingSelection] = useState<{
    startIdx: number;
    endIdx: number;
    points: StationaryDataPoint[];
  } | null>(null);
  const [savedProjects, setSavedProjects] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'sources' | 'calculations'>('sources');

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);

        // Restore stationaryData if available
        if (parsed.stationaryData) {
          const restoredData = {
            ...parsed.stationaryData,
            date: new Date(parsed.stationaryData.date),
            points: parsed.stationaryData.points.map((p: any) => ({
              ...p,
              datetime: new Date(p.datetime),
            })),
          };
          setStationaryData(restoredData);
        }

        // Restore sources
        if (parsed.sources) {
          const restoredSources = parsed.sources.map((s: any) => ({
            ...s,
            startTime: new Date(s.startTime),
            endTime: new Date(s.endTime),
          }));
          setSources(restoredSources);
        }
      }

      // Load saved projects
      const projects = JSON.parse(localStorage.getItem('stacionarni-zdroje-projekty') || '[]');
      setSavedProjects(projects);
    } catch (error) {
      console.error('Error loading saved state:', error);
    }
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (stationaryData) {
      try {
        const toSave = {
          stationaryData,
          sources,
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      } catch (error) {
        console.error('Error saving state:', error);
      }
    }
  }, [stationaryData, sources]);

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

    const hasBackground = sources.some(s => s.type === 'background');

    // If already has background, automatically add as source
    if (hasBackground) {
      handleConfirmSourceType('source', startIdx, endIdx, points);
    } else {
      // Show dialog to ask user
      setPendingSelection({ startIdx, endIdx, points });
    }
  };

  const handleConfirmSourceType = (type: 'source' | 'background', startIdx: number, endIdx: number, points: StationaryDataPoint[]) => {
    if (!stationaryData) return;

    const selectedPoints = points.slice(startIdx, endIdx + 1);
    if (selectedPoints.length === 0) return;

    const stats = calculateStationaryStats(selectedPoints);

    const startTime = selectedPoints[0].datetime;
    const endTime = selectedPoints[selectedPoints.length - 1].datetime;

    const sourceCount = sources.filter(s => s.type === 'source').length;
    const defaultName = type === 'background' ? 'Hluk pozadí' : `Zdroj hluku ${sourceCount + 1}`;

    // Detect tonal components
    const tonalComponents = detectTonalComponents(stats.avgFrequencies, STATIONARY_FREQUENCY_LIST);

    const timestamp = new Date().getTime();
    const newSource: StationarySource = {
      id: `source-${timestamp}`,
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
      tonalComponents,
      startIndex: startIdx,
      endIndex: endIdx,
    };

    setSources(prev => [...prev, newSource]);
    setPendingSelection(null);
  };

  const handleUpdateSource = (id: string, field: keyof StationarySource, value: string) => {
    setSources(prev => prev.map(source =>
      source.id === id ? { ...source, [field]: value } : source
    ));
  };

  const handleDeleteSource = (id: string) => {
    setSources(prev => prev.filter(source => source.id !== id));
  };

  const handleSaveProject = () => {
    const projectName = prompt('Zadej název projektu:');
    if (!projectName || !projectName.trim()) return;

    try {
      const savedProjects = JSON.parse(localStorage.getItem('stacionarni-zdroje-projekty') || '[]');

      const projectData = {
        id: `project-${Date.now()}`,
        name: projectName.trim(),
        timestamp: new Date().toISOString(),
        data: {
          stationaryMetadata: stationaryData ? {
            filename: stationaryData.filename,
            date: stationaryData.date,
            pointsCount: stationaryData.points.length,
          } : null,
          sources,
        },
      };
      savedProjects.push(projectData);
      localStorage.setItem('stacionarni-zdroje-projekty', JSON.stringify(savedProjects));
      setSavedProjects(savedProjects);
      alert(`Projekt "${projectName}" byl úspěšně uložen!`);
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
      const savedProjects = JSON.parse(localStorage.getItem('stacionarni-zdroje-projekty') || '[]');
      const project = savedProjects.find((p: any) => p.id === projectId);
      if (!project) return;

      const data = project.data;

      // Create mock stationaryData from metadata
      if (data.stationaryMetadata) {
        const mockData: StationaryData = {
          filename: data.stationaryMetadata.filename,
          date: new Date(data.stationaryMetadata.date),
          points: [],
        };
        setStationaryData(mockData);
      }

      // Restore sources
      if (data.sources) {
        const restoredSources = data.sources.map((s: any) => ({
          ...s,
          startTime: new Date(s.startTime),
          endTime: new Date(s.endTime),
        }));
        setSources(restoredSources);
      }

      alert(`Projekt "${project.name}" byl načten!\n\nZdroje jsou dostupné, ale graf není (data nebyla uložena).`);
    } catch (error) {
      console.error('Error loading project:', error);
      alert('Nepodařilo se načíst projekt.');
    }
  };

  const handleDownloadProject = () => {
    const projectName = prompt('Zadej název projektu:', stationaryData?.filename.replace('.xlsx', '') || 'projekt');
    if (!projectName || !projectName.trim()) return;

    try {
      const projectData = {
        version: '1.0',
        type: 'stacionarni-zdroje',
        name: projectName.trim(),
        timestamp: new Date().toISOString(),
        data: {
          stationaryData,
          sources,
        },
      };

      const jsonString = JSON.stringify(projectData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${projectName.trim()}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert(`Projekt "${projectName}" byl stažen!\n\nSoubor obsahuje VŠECHNA data včetně grafu.`);
    } catch (error) {
      console.error('Error downloading project:', error);
      alert('Nepodařilo se stáhnout projekt.');
    }
  };

  const handleUploadProject = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const projectData = JSON.parse(content);

        if (projectData.type !== 'stacionarni-zdroje') {
          alert('Neplatný typ projektu. Tento soubor není pro stacionární zdroje.');
          return;
        }

        const data = projectData.data;

        // Restore stationaryData with Date objects
        if (data.stationaryData) {
          const restoredData = {
            ...data.stationaryData,
            date: new Date(data.stationaryData.date),
            points: data.stationaryData.points.map((p: any) => ({
              ...p,
              datetime: new Date(p.datetime),
            })),
          };
          setStationaryData(restoredData);
        }

        // Restore sources
        if (data.sources) {
          const restoredSources = data.sources.map((s: any) => ({
            ...s,
            startTime: new Date(s.startTime),
            endTime: new Date(s.endTime),
          }));
          setSources(restoredSources);
        }

        alert(`Projekt "${projectData.name}" byl úspěšně nahrán!`);
      } catch (error) {
        console.error('Error uploading project:', error);
        alert('Nepodařilo se načíst projekt. Zkontroluj, že soubor je ve správném formátu.');
      }
    };

    reader.readAsText(file);
    event.target.value = '';
  };

  const handleDeleteProject = (projectId: string) => {
    try {
      const savedProjects = JSON.parse(localStorage.getItem('stacionarni-zdroje-projekty') || '[]');
      const updated = savedProjects.filter((p: any) => p.id !== projectId);
      localStorage.setItem('stacionarni-zdroje-projekty', JSON.stringify(updated));
      setSavedProjects(updated);
    } catch (error) {
      console.error('Error deleting project:', error);
    }
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

            {/* Upload Project File Section */}
            <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h3 className="text-sm font-medium text-purple-900 mb-3 flex items-center gap-2">
                📤 Nahrát uložený projekt
              </h3>
              <p className="text-xs text-purple-700 mb-3">
                Nahraj dříve stažený projekt (.json soubor) a pokračuj v práci se všemi daty.
              </p>
              <input
                type="file"
                accept=".json"
                onChange={handleUploadProject}
                className="block w-full text-sm text-gray-900 border border-purple-300 rounded-lg cursor-pointer bg-white focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
              />
            </div>

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
                <p>1. Nahraj Excel soubor s měřeními (datum, čas, LAeq, 31 frekvencí 20 Hz - 20 kHz)</p>
                <p>2. V grafu pomocí <strong>Alt + tažení myší</strong> vyber interval pro ZDROJ HLUKU</p>
                <p>3. Znovu vyber interval pro HLUK POZADÍ (druhý výběr)</p>
                <p>4. Automaticky se vypočítá LAeq, percentily a frekvenční spektrum</p>
                <p>5. Do tabulky můžeš upravit názvy měření</p>
                <p>6. V detailu uvidíš sloupcový graf se srovnáním zdroje a pozadí</p>
                <p>7. Exportuj výsledky do Excelu nebo graf jako PNG</p>
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
              <div className="flex gap-3">
                <button
                  onClick={handleDownloadProject}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center gap-2 shadow-sm"
                >
                  📥 Stáhnout projekt
                </button>
                <button
                  onClick={handleSaveProject}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors flex items-center gap-2 shadow-sm"
                >
                  💾 Uložit do prohlížeče
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                >
                  Nahrát jiný soubor
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Graf měření
              </h3>
              <StationaryChart
                data={stationaryData.points}
                onSourceSelection={handleAddSource}
              />
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  <TabButton
                    active={activeTab === 'sources'}
                    onClick={() => setActiveTab('sources')}
                    label="📋 Seznam zdrojů"
                  />
                  <TabButton
                    active={activeTab === 'calculations'}
                    onClick={() => setActiveTab('calculations')}
                    label="📊 Dopočet"
                  />
                </nav>
              </div>

              <div className="p-6">
                {activeTab === 'sources' && (
                  <StationarySourceTable
                    sources={sources}
                    onUpdateSource={handleUpdateSource}
                    onDeleteSource={handleDeleteSource}
                  />
                )}
                {activeTab === 'calculations' && (
                  <StationaryCalculations
                    sources={sources}
                    allSources={sources}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-12 py-6 text-center text-sm text-gray-500">
        <p>Stacionární zdroje hluku • Vytvořeno s Next.js a TypeScript</p>
      </footer>

      {/* Source Type Dialog */}
      {pendingSelection && (
        <SourceTypeDialog
          onSelect={(type) => handleConfirmSourceType(
            type,
            pendingSelection.startIdx,
            pendingSelection.endIdx,
            pendingSelection.points
          )}
          hasBackground={sources.some(s => s.type === 'background')}
        />
      )}
    </div>
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
          ? 'border-orange-600 text-orange-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      {label}
    </button>
  );
}
