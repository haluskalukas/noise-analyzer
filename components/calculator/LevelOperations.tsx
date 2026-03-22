'use client';

import { useState } from 'react';
import { logarithmicSum, logarithmicDifference, averageExposure, formatResult } from '@/lib/acousticCalculations';

export function LevelOperations() {
  // Logarithmic Sum
  const [sumLevels, setSumLevels] = useState<string[]>(['', '', '', '', '', '']);

  // Logarithmic Difference
  const [diffTotal, setDiffTotal] = useState('');
  const [diffLevels, setDiffLevels] = useState<string[]>(['', '', '', '', '']);

  // Average
  const [avgLevels, setAvgLevels] = useState<string[]>(['', '', '', '', '', '', '', '', '', '']);

  const calculateSum = () => {
    const levels = sumLevels.map(l => parseFloat(l)).filter(l => !isNaN(l));
    return logarithmicSum(levels);
  };

  const calculateDiff = () => {
    const total = parseFloat(diffTotal);
    const levels = diffLevels.map(l => parseFloat(l)).filter(l => !isNaN(l));
    if (isNaN(total)) return { result: 0, difference: 0, status: 'no_correction' as const };
    return logarithmicDifference(total, levels);
  };

  const calculateAvg = () => {
    const levels = avgLevels.map(l => parseFloat(l)).filter(l => !isNaN(l));
    return averageExposure(levels);
  };

  const sumResult = calculateSum();
  const diffResult = calculateDiff();
  const avgResult = calculateAvg();

  return (
    <div className="space-y-8">
      {/* Logarithmic Sum */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">➕</span>
          <div>
            <h3 className="text-xl font-bold text-blue-900">Logaritmický součet hladin</h3>
            <p className="text-sm text-blue-700">Energetické sčítání hluku z více zdrojů</p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-600 mb-2 font-mono">
            L<sub>sum</sub> = 10 × log₁₀(∑ 10<sup>Li/10</sup>)
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          {sumLevels.map((level, idx) => (
            <div key={idx}>
              <label className="block text-sm font-medium text-blue-900 mb-1">
                L{idx + 1} (dB)
              </label>
              <input
                type="number"
                step="0.1"
                value={level}
                onChange={(e) => {
                  const newLevels = [...sumLevels];
                  newLevels[idx] = e.target.value;
                  setSumLevels(newLevels);
                }}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="—"
              />
            </div>
          ))}
        </div>

        <div className="bg-blue-900 text-white rounded-lg p-4 text-center">
          <div className="text-sm font-medium mb-1">Výsledek</div>
          <div className="text-3xl font-bold">{formatResult(sumResult, 1)} dB</div>
        </div>
      </div>

      {/* Logarithmic Difference */}
      <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">➖</span>
          <div>
            <h3 className="text-xl font-bold text-orange-900">Logaritmický odečet hladin</h3>
            <p className="text-sm text-orange-700">Odečtení hladin zvuku</p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-600 mb-2 font-mono">
            L<sub>diff</sub> = 10 × log₁₀(10<sup>L1/10</sup> - ∑ 10<sup>Li/10</sup>)
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-orange-900 mb-1">
            L1 - Celková hladina (dB)
          </label>
          <input
            type="number"
            step="0.1"
            value={diffTotal}
            onChange={(e) => setDiffTotal(e.target.value)}
            className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Např. 75.0"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          {diffLevels.map((level, idx) => (
            <div key={idx}>
              <label className="block text-sm font-medium text-orange-900 mb-1">
                L{idx + 2} - Odečíst (dB)
              </label>
              <input
                type="number"
                step="0.1"
                value={level}
                onChange={(e) => {
                  const newLevels = [...diffLevels];
                  newLevels[idx] = e.target.value;
                  setDiffLevels(newLevels);
                }}
                className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="—"
              />
            </div>
          ))}
        </div>

        <div className="bg-orange-900 text-white rounded-lg p-4 text-center">
          <div className="text-sm font-medium mb-1">Výsledná hladina</div>
          <div className="text-3xl font-bold">{formatResult(diffResult.result, 1)} dB</div>
        </div>
      </div>

      {/* Average Exposure */}
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">📊</span>
          <div>
            <h3 className="text-xl font-bold text-purple-900">Průměrná expozice hluku</h3>
            <p className="text-sm text-purple-700">Logaritmický průměr z více měření</p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-600 mb-2 font-mono">
            LAeq = 10 × log₁₀(1/n × ∑ 10<sup>Li/10</sup>)
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          {avgLevels.map((level, idx) => (
            <div key={idx}>
              <label className="block text-sm font-medium text-purple-900 mb-1">
                Měření {idx + 1} (dB)
              </label>
              <input
                type="number"
                step="0.1"
                value={level}
                onChange={(e) => {
                  const newLevels = [...avgLevels];
                  newLevels[idx] = e.target.value;
                  setAvgLevels(newLevels);
                }}
                className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="—"
              />
            </div>
          ))}
        </div>

        <div className="bg-purple-900 text-white rounded-lg p-4 text-center">
          <div className="text-sm font-medium mb-1">Průměrná hladina LAeq</div>
          <div className="text-3xl font-bold">{formatResult(avgResult, 1)} dB</div>
          <div className="text-sm mt-1 opacity-80">
            z {avgLevels.filter(l => l && !isNaN(parseFloat(l))).length} měření
          </div>
        </div>
      </div>
    </div>
  );
}
