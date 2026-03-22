'use client';

import { useState } from 'react';
import { compositeSoundInsulation, formatResult } from '@/lib/acousticCalculations';
import { SoundInsulationElement } from '@/types/calculator';

export function SoundInsulation() {
  const [elements, setElements] = useState<Array<{ name: string; rw: string; area: string }>>([
    { name: 'Stěna', rw: '', area: '' },
    { name: 'Okno', rw: '', area: '' },
    { name: 'Dveře', rw: '', area: '' },
  ]);

  const addElement = () => {
    setElements([...elements, { name: `Prvek ${elements.length + 1}`, rw: '', area: '' }]);
  };

  const removeElement = (index: number) => {
    setElements(elements.filter((_, i) => i !== index));
  };

  const updateElement = (index: number, field: 'name' | 'rw' | 'area', value: string) => {
    const newElements = [...elements];
    newElements[index][field] = value;
    setElements(newElements);
  };

  const calculate = () => {
    const validElements: SoundInsulationElement[] = elements
      .filter(e => e.rw && e.area)
      .map(e => ({
        name: e.name,
        rw: parseFloat(e.rw),
        area: parseFloat(e.area),
      }))
      .filter(e => !isNaN(e.rw) && !isNaN(e.area));

    if (validElements.length === 0) return 0;
    return compositeSoundInsulation(validElements);
  };

  const totalArea = elements
    .filter(e => e.area)
    .reduce((sum, e) => sum + (parseFloat(e.area) || 0), 0);

  const result = calculate();

  // Common Rw values for quick selection
  const commonValues = {
    'Dřevěná příčka': 35,
    'Okno (jednoduchá tabule)': 30,
    'Okno (dvojité zasklení)': 40,
    'Okno (izolační)': 45,
    'Dveře dřevěné': 25,
    'Dveře protipožární': 35,
    'Zdivo cihelné 150mm': 50,
    'Zdivo cihelné 300mm': 55,
    'Železobetonová stěna 150mm': 52,
    'Železobetonová stěna 200mm': 56,
    'Sádrokartonová příčka': 42,
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl p-6 border border-rose-200">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🏗️</span>
          <div>
            <h3 className="text-xl font-bold text-rose-900">Neprůzvučnost složené konstrukce</h3>
            <p className="text-sm text-rose-700">Výpočet výsledné neprůzvučnosti stěny</p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-600 mb-2 font-mono">
            R'<sub>w,res</sub> = 10 × log₁₀(S<sub>celk</sub>) - 10 × log₁₀(∑(Si × 10<sup>-Rwi/10</sup>))
          </p>
        </div>

        {/* Common Values Reference */}
        <details className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-200">
          <summary className="cursor-pointer font-semibold text-blue-900 flex items-center gap-2">
            📚 Typické hodnoty neprůzvučnosti Rw
          </summary>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            {Object.entries(commonValues).map(([name, value]) => (
              <div key={name} className="flex justify-between bg-white px-3 py-2 rounded border border-blue-200">
                <span className="text-gray-700">{name}:</span>
                <span className="font-semibold text-blue-900">{value} dB</span>
              </div>
            ))}
          </div>
        </details>

        {/* Elements List */}
        <div className="space-y-3 mb-4">
          {elements.map((element, index) => (
            <div key={index} className="bg-white rounded-lg p-4 border-2 border-rose-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <input
                  type="text"
                  value={element.name}
                  onChange={(e) => updateElement(index, 'name', e.target.value)}
                  className="font-semibold text-rose-900 bg-transparent border-b border-rose-300 focus:outline-none focus:border-rose-600 px-1"
                  placeholder="Název prvku"
                />
                {elements.length > 1 && (
                  <button
                    onClick={() => removeElement(index)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    × Odstranit
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rw - Neprůzvučnost (dB)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={element.rw}
                    onChange={(e) => updateElement(index, 'rw', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="Např. 52.0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    S - Plocha (m²)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={element.area}
                    onChange={(e) => updateElement(index, 'area', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="Např. 10.0"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={addElement}
          className="w-full mb-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <span className="text-xl">+</span>
          Přidat prvek konstrukce
        </button>

        {/* Summary */}
        <div className="bg-white rounded-lg p-4 mb-4 border-2 border-rose-300">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-gray-700">Počet prvků:</span>
            <span className="text-lg font-bold text-rose-900">
              {elements.filter(e => e.rw && e.area).length}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Celková plocha:</span>
            <span className="text-lg font-bold text-rose-900">{totalArea.toFixed(2)} m²</span>
          </div>
        </div>

        {/* Result */}
        <div className="bg-rose-900 text-white rounded-lg p-4 text-center">
          <div className="text-sm font-medium mb-1">R'w,res - Výsledná vážená neprůzvučnost</div>
          <div className="text-3xl font-bold">{formatResult(result, 1)} dB</div>
          <div className="text-sm mt-1 opacity-80">
            pro celkovou plochu {totalArea.toFixed(2)} m²
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex gap-2">
            <span className="text-amber-600 text-xl">💡</span>
            <div className="text-sm text-amber-900">
              <p className="font-semibold mb-1">Interpretace výsledku:</p>
              <ul className="space-y-1 text-xs">
                <li>• <strong>30-40 dB:</strong> Slabá neprůzvučnost (dřevěné konstrukce)</li>
                <li>• <strong>40-50 dB:</strong> Střední neprůzvučnost (lehké stěny)</li>
                <li>• <strong>50-60 dB:</strong> Dobrá neprůzvučnost (cihelné stěny)</li>
                <li>• <strong>60+ dB:</strong> Výborná neprůzvučnost (těžké stěny)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
