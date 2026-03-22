'use client';

import { useState } from 'react';
import {
  distanceAttenuationPoint,
  distanceChangePoint,
  distanceChangeLinear,
  linearSourceFiniteLength,
  surfaceSourceWithReflection,
  surfaceSourceOnly,
  formatResult
} from '@/lib/acousticCalculations';
import { DIRECTIVITY_LABELS } from '@/types/calculator';

type CalculationType = 'point' | 'point-change' | 'linear-change' | 'linear-finite' | 'surface-reflection' | 'surface';

export function DistanceAttenuation() {
  const [activeCalc, setActiveCalc] = useState<CalculationType>('point');

  // Point source from acoustic power
  const [pointLw, setPointLw] = useState('');
  const [pointQ, setPointQ] = useState('2');
  const [pointR, setPointR] = useState('');

  // Point source distance change
  const [pointChangeLp, setPointChangeLp] = useState('');
  const [pointChangeR1, setPointChangeR1] = useState('');
  const [pointChangeR2, setPointChangeR2] = useState('');

  // Linear source distance change
  const [linearChangeLp, setLinearChangeLp] = useState('');
  const [linearChangeR1, setLinearChangeR1] = useState('');
  const [linearChangeR2, setLinearChangeR2] = useState('');

  // Linear finite
  const [linearLw, setLinearLw] = useState('');
  const [linearA, setLinearA] = useState('');
  const [linearD, setLinearD] = useState('');

  // Surface with reflection
  const [surfReflLw, setSurfReflLw] = useState('');
  const [surfReflS, setSurfReflS] = useState('');
  const [surfReflQ, setSurfReflQ] = useState('2');
  const [surfReflR, setSurfReflR] = useState('');

  // Surface only
  const [surfLw, setSurfLw] = useState('');
  const [surfS, setSurfS] = useState('');

  const calculations = [
    { id: 'point' as const, name: 'Bodový zdroj', icon: '⭕', color: 'blue' },
    { id: 'point-change' as const, name: 'Bodový - změna vzd.', icon: '📍', color: 'cyan' },
    { id: 'linear-change' as const, name: 'Liniový - změna vzd.', icon: '📏', color: 'teal' },
    { id: 'linear-finite' as const, name: 'Čárový konečné délky', icon: '〰️', color: 'green' },
    { id: 'surface-reflection' as const, name: 'Plošný s odrazem', icon: '🔲', color: 'yellow' },
    { id: 'surface' as const, name: 'Plošný', icon: '▢', color: 'orange' },
  ];

  const getResult = () => {
    switch (activeCalc) {
      case 'point':
        return distanceAttenuationPoint(parseFloat(pointLw), parseFloat(pointQ), parseFloat(pointR));
      case 'point-change':
        return distanceChangePoint(parseFloat(pointChangeLp), parseFloat(pointChangeR1), parseFloat(pointChangeR2));
      case 'linear-change':
        return distanceChangeLinear(parseFloat(linearChangeLp), parseFloat(linearChangeR1), parseFloat(linearChangeR2));
      case 'linear-finite':
        return linearSourceFiniteLength(parseFloat(linearLw), parseFloat(linearA), parseFloat(linearD));
      case 'surface-reflection':
        return surfaceSourceWithReflection(parseFloat(surfReflLw), parseFloat(surfReflS), parseFloat(surfReflQ), parseFloat(surfReflR));
      case 'surface':
        return surfaceSourceOnly(parseFloat(surfLw), parseFloat(surfS));
      default:
        return 0;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6 border border-indigo-200">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">📐</span>
          <div>
            <h3 className="text-xl font-bold text-indigo-900">Útlum vlivem vzdálenosti</h3>
            <p className="text-sm text-indigo-700">Výpočet útlumu zvuku se vzdáleností</p>
          </div>
        </div>

        {/* Calculation Type Selector */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          {calculations.map(calc => (
            <button
              key={calc.id}
              onClick={() => setActiveCalc(calc.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                activeCalc === calc.id
                  ? `border-${calc.color}-600 bg-${calc.color}-100 shadow-lg scale-105`
                  : 'border-gray-300 bg-white hover:border-gray-400'
              }`}
            >
              <div className="text-2xl mb-1">{calc.icon}</div>
              <div className={`text-sm font-medium ${
                activeCalc === calc.id ? `text-${calc.color}-900` : 'text-gray-700'
              }`}>
                {calc.name}
              </div>
            </button>
          ))}
        </div>

        {/* Input Forms */}
        <div className="bg-white rounded-lg p-6 mb-4">
          {activeCalc === 'point' && (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 mb-4">Lp = Lw + 10×log(Q/(4πr²))</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lw - Akustický výkon (dB)</label>
                <input
                  type="number"
                  step="0.1"
                  value={pointLw}
                  onChange={(e) => setPointLw(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Např. 85.0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Q - Směrovost</label>
                <select
                  value={pointQ}
                  onChange={(e) => setPointQ(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="1">{DIRECTIVITY_LABELS[1]}</option>
                  <option value="2">{DIRECTIVITY_LABELS[2]}</option>
                  <option value="4">{DIRECTIVITY_LABELS[4]}</option>
                  <option value="8">{DIRECTIVITY_LABELS[8]}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">r - Vzdálenost (m)</label>
                <input
                  type="number"
                  step="0.1"
                  value={pointR}
                  onChange={(e) => setPointR(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Např. 10.0"
                />
              </div>
            </div>
          )}

          {activeCalc === 'point-change' && (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 mb-4">Lp2 = Lp1 + 20×log(r1/r2)</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lp1 - Hladina ve vzd. r1 (dB)</label>
                <input
                  type="number"
                  step="0.1"
                  value={pointChangeLp}
                  onChange={(e) => setPointChangeLp(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Např. 75.0"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">r1 - Výchozí vzd. (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={pointChangeR1}
                    onChange={(e) => setPointChangeR1(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Např. 5.0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">r2 - Nová vzd. (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={pointChangeR2}
                    onChange={(e) => setPointChangeR2(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Např. 50.0"
                  />
                </div>
              </div>
            </div>
          )}

          {activeCalc === 'linear-change' && (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 mb-4">Lp2 = Lp1 + 10×log(r1/r2)</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lp1 - Hladina ve vzd. r1 (dB)</label>
                <input
                  type="number"
                  step="0.1"
                  value={linearChangeLp}
                  onChange={(e) => setLinearChangeLp(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Např. 75.0"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">r1 - Výchozí vzd. (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={linearChangeR1}
                    onChange={(e) => setLinearChangeR1(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Např. 5.0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">r2 - Nová vzd. (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={linearChangeR2}
                    onChange={(e) => setLinearChangeR2(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Např. 50.0"
                  />
                </div>
              </div>
            </div>
          )}

          {activeCalc === 'linear-finite' && (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 mb-4">Lp = Lw + 10×log(arctg(a/d)) - 10×log(4π×a×d)</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lw - Akustický výkon (dB)</label>
                <input
                  type="number"
                  step="0.1"
                  value={linearLw}
                  onChange={(e) => setLinearLw(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Např. 85.0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">a - Délka zářiče (m)</label>
                <input
                  type="number"
                  step="0.1"
                  value={linearA}
                  onChange={(e) => setLinearA(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Např. 100.0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">d - Kolmá vzdálenost (m)</label>
                <input
                  type="number"
                  step="0.1"
                  value={linearD}
                  onChange={(e) => setLinearD(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Např. 10.0"
                />
              </div>
            </div>
          )}

          {activeCalc === 'surface-reflection' && (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 mb-4">Lp = Lw - 10×log(S + 4πr²/Q)</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lw - Akustický výkon (dB)</label>
                <input
                  type="number"
                  step="0.1"
                  value={surfReflLw}
                  onChange={(e) => setSurfReflLw(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Např. 85.0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">S - Plocha (m²)</label>
                <input
                  type="number"
                  step="0.1"
                  value={surfReflS}
                  onChange={(e) => setSurfReflS(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Např. 100.0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Q - Směrovost</label>
                <select
                  value={surfReflQ}
                  onChange={(e) => setSurfReflQ(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="1">{DIRECTIVITY_LABELS[1]}</option>
                  <option value="2">{DIRECTIVITY_LABELS[2]}</option>
                  <option value="4">{DIRECTIVITY_LABELS[4]}</option>
                  <option value="8">{DIRECTIVITY_LABELS[8]}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">r - Vzdálenost (m)</label>
                <input
                  type="number"
                  step="0.1"
                  value={surfReflR}
                  onChange={(e) => setSurfReflR(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Např. 10.0"
                />
              </div>
            </div>
          )}

          {activeCalc === 'surface' && (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 mb-4">Lp = Lw - 10×log(S)</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lw - Akustický výkon (dB)</label>
                <input
                  type="number"
                  step="0.1"
                  value={surfLw}
                  onChange={(e) => setSurfLw(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Např. 85.0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">S - Plocha (m²)</label>
                <input
                  type="number"
                  step="0.1"
                  value={surfS}
                  onChange={(e) => setSurfS(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Např. 100.0"
                />
              </div>
            </div>
          )}
        </div>

        {/* Result */}
        <div className="bg-indigo-900 text-white rounded-lg p-4 text-center">
          <div className="text-sm font-medium mb-1">Lp - Hladina akustického tlaku</div>
          <div className="text-3xl font-bold">{formatResult(getResult(), 1)} dB</div>
        </div>
      </div>
    </div>
  );
}
