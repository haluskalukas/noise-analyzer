'use client';

import { useState } from 'react';
import { exposureDurationCorrection, multipleSourcesDuration, formatResult } from '@/lib/acousticCalculations';

export function ExposureDuration() {
  // Single source
  const [singleLaeq, setSingleLaeq] = useState('');
  const [singleT, setSingleT] = useState('');
  const [singleRefT, setSingleRefT] = useState('');
  const [singleUnit, setSingleUnit] = useState<'hours' | 'minutes'>('hours');

  // Multiple sources
  const [multiRefT, setMultiRefT] = useState('480');
  const [sources, setSources] = useState<Array<{ laeq: string; duration: string }>>([
    { laeq: '', duration: '' },
    { laeq: '', duration: '' },
    { laeq: '', duration: '' },
  ]);

  const addSource = () => {
    setSources([...sources, { laeq: '', duration: '' }]);
  };

  const removeSource = (index: number) => {
    setSources(sources.filter((_, i) => i !== index));
  };

  const updateSource = (index: number, field: 'laeq' | 'duration', value: string) => {
    const newSources = [...sources];
    newSources[index][field] = value;
    setSources(newSources);
  };

  const calculateSingle = () => {
    const laeq = parseFloat(singleLaeq);
    const t = parseFloat(singleT);
    const refT = parseFloat(singleRefT);
    if (isNaN(laeq) || isNaN(t) || isNaN(refT)) return 0;
    return exposureDurationCorrection(laeq, t, refT);
  };

  const calculateMultiple = () => {
    const refT = parseFloat(multiRefT);
    if (isNaN(refT)) return 0;

    const validSources = sources
      .filter(s => s.laeq && s.duration)
      .map(s => ({
        laeq: parseFloat(s.laeq),
        duration: parseFloat(s.duration),
      }))
      .filter(s => !isNaN(s.laeq) && !isNaN(s.duration));

    if (validSources.length === 0) return 0;
    return multipleSourcesDuration(validSources, refT);
  };

  const totalDuration = sources
    .filter(s => s.duration)
    .reduce((sum, s) => sum + (parseFloat(s.duration) || 0), 0);

  const remainingTime = parseFloat(multiRefT) - totalDuration;

  return (
    <div className="space-y-8">
      {/* Single Source */}
      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">⏱️</span>
          <div>
            <h3 className="text-xl font-bold text-emerald-900">Délka působení zdroje</h3>
            <p className="text-sm text-emerald-700">Přepočet na referenční časový interval</p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-600 mb-2 font-mono">
            LAeq,T = 10 × log₁₀((10<sup>LAeq,t/10</sup> × t) / T)
          </p>
        </div>

        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-emerald-900 mb-1">
              LAeq,t - Naměřená hladina (dB)
            </label>
            <input
              type="number"
              step="0.1"
              value={singleLaeq}
              onChange={(e) => setSingleLaeq(e.target.value)}
              className="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Např. 105.0"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-emerald-900 mb-1">
                t - Doba působení
              </label>
              <input
                type="number"
                step="0.1"
                value={singleT}
                onChange={(e) => setSingleT(e.target.value)}
                className="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Např. 6"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-emerald-900 mb-1">
                T - Referenční interval
              </label>
              <input
                type="number"
                step="0.1"
                value={singleRefT}
                onChange={(e) => setSingleRefT(e.target.value)}
                className="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Např. 14"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-emerald-900 mb-2">Jednotka</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="unit"
                  value="hours"
                  checked={singleUnit === 'hours'}
                  onChange={() => setSingleUnit('hours')}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700">Hodiny</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="unit"
                  value="minutes"
                  checked={singleUnit === 'minutes'}
                  onChange={() => setSingleUnit('minutes')}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700">Minuty</span>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-emerald-900 text-white rounded-lg p-4 text-center">
          <div className="text-sm font-medium mb-1">LAeq,T - Výsledná hladina</div>
          <div className="text-3xl font-bold">{formatResult(calculateSingle(), 1)} dB</div>
          <div className="text-sm mt-1 opacity-80">
            pro referenční interval {singleRefT} {singleUnit === 'hours' ? 'hod' : 'min'}
          </div>
        </div>
      </div>

      {/* Multiple Sources */}
      <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-6 border border-teal-200">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">⏰</span>
          <div>
            <h3 className="text-xl font-bold text-teal-900">Délky působení více zdrojů</h3>
            <p className="text-sm text-teal-700">Výpočet celkové expozice z více zdrojů</p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-600 mb-2 font-mono">
            LAeq,T = 10 × log₁₀((∑(10<sup>Li/10</sup> × ti)) / T)
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-teal-900 mb-1">
            T - Celkový referenční interval (minuty)
          </label>
          <input
            type="number"
            step="1"
            value={multiRefT}
            onChange={(e) => setMultiRefT(e.target.value)}
            className="w-full px-3 py-2 border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="Např. 480"
          />
        </div>

        <div className="space-y-3 mb-4">
          {sources.map((source, index) => (
            <div key={index} className="bg-white rounded-lg p-4 border-2 border-teal-200">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-teal-900">Zdroj {index + 1}</span>
                {sources.length > 1 && (
                  <button
                    onClick={() => removeSource(index)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    × Odstranit
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">LAeq (dB)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={source.laeq}
                    onChange={(e) => updateSource(index, 'laeq', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Např. 75.0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Doba (min)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={source.duration}
                    onChange={(e) => updateSource(index, 'duration', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Např. 30"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={addSource}
          className="w-full mb-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <span className="text-xl">+</span>
          Přidat zdroj
        </button>

        <div className="bg-white rounded-lg p-4 mb-4 border-2 border-teal-300">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Celková doba zdrojů:</span>
            <span className="text-lg font-bold text-teal-900">{totalDuration.toFixed(1)} min</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Zbývající čas (klid):</span>
            <span className={`text-lg font-bold ${remainingTime >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {remainingTime.toFixed(1)} min
            </span>
          </div>
        </div>

        <div className="bg-teal-900 text-white rounded-lg p-4 text-center">
          <div className="text-sm font-medium mb-1">LAeq,T - Výsledná ekvivalentní hladina</div>
          <div className="text-3xl font-bold">{formatResult(calculateMultiple(), 1)} dB</div>
          <div className="text-sm mt-1 opacity-80">
            z {sources.filter(s => s.laeq && s.duration).length} zdrojů za {multiRefT} min
          </div>
        </div>
      </div>
    </div>
  );
}
