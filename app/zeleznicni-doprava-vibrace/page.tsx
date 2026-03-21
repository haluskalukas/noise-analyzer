'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { VibrationFileUpload } from '@/components/VibrationFileUpload';
import { VibrationChart } from '@/components/VibrationChart';
import { VibrationTrainTable } from '@/components/VibrationTrainTable';
import { VibrationData, VibrationDataPoint, VibrationTrain } from '@/types/vibration';
import { calculateTrainVibration } from '@/lib/vibrationCalculations';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';

const STORAGE_KEY = 'zeleznicni-doprava-vibrace-state';

export default function ZeleznicniDopravaVibrace() {
  const [vibrationData, setVibrationData] = useState<VibrationData | null>(null);
  const [trains, setTrains] = useState<VibrationTrain[]>([]);

  // Note: We don't use localStorage for vibration data because files are too large
  // Users should use Download/Upload project instead

  const handleDataLoaded = (data: VibrationData) => {
    setVibrationData(data);
    setTrains([]);
  };

  const handleReset = () => {
    setVibrationData(null);
    setTrains([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleAddTrain = (startIdx: number, endIdx: number, points: VibrationDataPoint[]) => {
    if (!vibrationData) return;

    // Get selected interval
    const selectedPoints = points.slice(startIdx, endIdx + 1);
    if (selectedPoints.length === 0) return;

    // Calculate vibration parameters
    const calculations = calculateTrainVibration(selectedPoints);

    // Get times
    const startTime = selectedPoints[0].datetime;
    const endTime = selectedPoints[selectedPoints.length - 1].datetime;

    const newTrain: VibrationTrain = {
      id: `train-${Date.now()}`,
      startTime,
      endTime,
      trakce: '',
      druhVlaku: '',
      pocetVozu: '',
      smer: '',
      lawX: calculations.lawX,
      lawY: calculations.lawY,
      lawZ: calculations.lawZ,
      rmsX: calculations.rmsX,
      rmsY: calculations.rmsY,
      rmsZ: calculations.rmsZ,
      startIndex: startIdx,
      endIndex: endIdx,
    };

    setTrains(prev => [...prev, newTrain]);
  };

  const handleUpdateTrain = (id: string, field: keyof VibrationTrain, value: string) => {
    setTrains(prev => prev.map(train =>
      train.id === id ? { ...train, [field]: value } : train
    ));
  };

  const handleDeleteTrain = (id: string) => {
    setTrains(prev => prev.filter(train => train.id !== id));
  };

  const handleDownloadProject = () => {
    const projectName = prompt('Zadej název projektu:', vibrationData?.filename.replace('.xlsx', '') || 'projekt');
    if (!projectName || !projectName.trim()) return;

    try {
      // Create full project data with ALL information including raw data
      const projectData = {
        version: '1.0',
        type: 'zeleznicni-doprava-vibrace',
        name: projectName.trim(),
        timestamp: new Date().toISOString(),
        data: {
          vibrationData,
          trains,
        },
      };

      // Convert to JSON and create download
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

        // Validate project type
        if (projectData.type !== 'zeleznicni-doprava-vibrace') {
          alert('Neplatný typ projektu. Tento soubor není pro železniční dopravu - vibrace.');
          return;
        }

        const data = projectData.data;

        // Restore vibrationData with Date objects
        if (data.vibrationData) {
          const restoredData = {
            ...data.vibrationData,
            date: new Date(data.vibrationData.date),
            points: data.vibrationData.points.map((p: any) => ({
              ...p,
              datetime: new Date(p.datetime),
            })),
          };
          setVibrationData(restoredData);
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

        alert(`Projekt "${projectData.name}" byl načten!\n\nVšechna data včetně grafu jsou k dispozici.`);
      } catch (error) {
        console.error('Error loading project:', error);
        alert('Nepodařilo se načíst projekt. Ujisti se, že soubor je platný projekt.');
      }
    };
    reader.readAsText(file);

    // Reset input to allow loading the same file again
    event.target.value = '';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🛤️ Železniční doprava - vibrace
              </h1>
              <p className="mt-2 text-gray-600">
                Analýza měření vibrací z průjezdů vlaků
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
        {!vibrationData ? (
          /* Upload Section */
          <div className="max-w-3xl mx-auto">
            <VibrationFileUpload onDataLoaded={handleDataLoaded} />

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

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
                💡 Jak používat tento modul
              </h3>
              <div className="text-xs text-blue-800 space-y-2">
                <p>1. Nahraj Excel soubor s měřeními vibrací (datum, čas, 60 frekvencí)</p>
                <p>2. V grafu pomocí <strong>Alt + tažení myší</strong> vyber interval průjezdu vlaku</p>
                <p>3. Automaticky se vypočítá L<sub>aw</sub> pro osy X, Y, Z a RMS pro všechny frekvence</p>
                <p>4. Do tabulky doplň údaje o vlaku (trakce, druh, počet vozů, směr)</p>
                <p>5. Exportuj výsledky do Excelu</p>
              </div>
            </div>

            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-6">
              <h3 className="text-sm font-medium text-amber-900 mb-2 flex items-center gap-2">
                ⚠️ Důležité upozornění
              </h3>
              <div className="text-xs text-amber-800 space-y-2">
                <p><strong>Data se NEUKLÁDAJÍ automaticky!</strong> Soubory vibrací jsou příliš velké pro prohlížeč.</p>
                <p>Pro uložení práce použij tlačítko <strong>"📥 Stáhnout projekt"</strong> - vytvoří se .json soubor se VŠEMI daty.</p>
                <p>Při příštím použití nahraj stažený projekt pomocí <strong>"📤 Nahrát uložený projekt"</strong>.</p>
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
                  {vibrationData.filename}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {format(vibrationData.date, 'PPP', { locale: cs })} • {vibrationData.points.length} měření • {trains.length} vlaků
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
                  onClick={handleReset}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                >
                  Nahrát jiný soubor
                </button>
              </div>
            </div>

            {/* Graph */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Graf měření - výběr průjezdů vlaků
              </h3>
              <VibrationChart
                data={vibrationData.points}
                onTrainSelection={handleAddTrain}
              />
            </div>

            {/* Train Table */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <VibrationTrainTable
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
        <p>Železniční doprava - vibrace • Vytvořeno s Next.js a TypeScript</p>
      </footer>
    </div>
  );
}
