'use client';

import { useState } from 'react';
import { calculateNoise, calculateNoiseDifference } from '@/lib/noiseCalculator';
import { GroupedTrafficSummary } from '@/types/traffic';

interface NoiseCalculatorProps {
  countingGrouped: GroupedTrafficSummary | null;
  rpdiGrouped: GroupedTrafficSummary | null;
}

export default function NoiseCalculator({ countingGrouped, rpdiGrouped }: NoiseCalculatorProps) {
  const [speed, setSpeed] = useState<number>(50);
  const [measuredDay, setMeasuredDay] = useState<number>(0);
  const [measuredNight, setMeasuredNight] = useState<number>(0);

  // Výpočet hluku ze sčítání
  const countingNoiseDay = countingGrouped
    ? calculateNoise({
        category1: countingGrouped.day.category1,
        category2: countingGrouped.day.category2,
        category3: countingGrouped.day.category3,
        speed,
      })
    : null;

  const countingNoiseNight = countingGrouped
    ? calculateNoise({
        category1: countingGrouped.night.category1,
        category2: countingGrouped.night.category2,
        category3: countingGrouped.night.category3,
        speed,
      })
    : null;

  // Výpočet hluku z RPDI
  const rpdiNoiseDay = rpdiGrouped
    ? calculateNoise({
        category1: rpdiGrouped.day.category1,
        category2: rpdiGrouped.day.category2,
        category3: rpdiGrouped.day.category3,
        speed,
      })
    : null;

  const rpdiNoiseNight = rpdiGrouped
    ? calculateNoise({
        category1: rpdiGrouped.night.category1,
        category2: rpdiGrouped.night.category2,
        category3: rpdiGrouped.night.category3,
        speed,
      })
    : null;

  // Rozdíly
  const differenceDay =
    countingNoiseDay && rpdiNoiseDay
      ? Math.round((rpdiNoiseDay.LAeq - countingNoiseDay.LAeq) * 10) / 10
      : null;

  const differenceNight =
    countingNoiseNight && rpdiNoiseNight
      ? Math.round((rpdiNoiseNight.LAeq - countingNoiseNight.LAeq) * 10) / 10
      : null;

  // Výsledné hodnoty (naměřená + rozdíl)
  const finalDay = measuredDay && differenceDay !== null ? Math.round((measuredDay + differenceDay) * 10) / 10 : null;
  const finalNight =
    measuredNight && differenceNight !== null ? Math.round((measuredNight + differenceNight) * 10) / 10 : null;

  return (
    <div className="space-y-6">
      {/* Nadpis */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">🔊 Výpočet hluku</h2>
        <p className="text-gray-600">
          Porovnání hladiny hluku ze sčítání dopravy vs. RPDI dle TP 189, vzdálenost 7,5 m od osy silnice
        </p>
      </div>

      {/* Parametry */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Parametry výpočtu</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rychlost (km/h)</label>
            <input
              type="number"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="20"
              max="130"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Naměřený hluk den [dB(A)]</label>
            <input
              type="number"
              value={measuredDay || ''}
              onChange={(e) => setMeasuredDay(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              step="0.1"
              placeholder="0.0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Naměřený hluk noc [dB(A)]</label>
            <input
              type="number"
              value={measuredNight || ''}
              onChange={(e) => setMeasuredNight(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              step="0.1"
              placeholder="0.0"
            />
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-3">
          Vzdálenost: <strong>7,5 m</strong> od osy silnice (fixní)
        </p>
      </div>

      {/* Tabulka výsledků */}
      {countingGrouped && rpdiGrouped ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Období
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Naměřené hodnoty [dB(A)]
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hluk v 7,5 m - sčítání [dB(A)]
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hluk v 7,5 m - RPDI [dB(A)]
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rozdíl [dB(A)]
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                    Výsledná hodnota [dB(A)]
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Den */}
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">Den (6-22h)</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {measuredDay > 0 ? measuredDay.toFixed(1) : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {countingNoiseDay ? countingNoiseDay.LAeq.toFixed(1) : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{rpdiNoiseDay ? rpdiNoiseDay.LAeq.toFixed(1) : '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {differenceDay !== null ? (
                      <span className={differenceDay > 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                        {differenceDay > 0 ? '+' : ''}
                        {differenceDay.toFixed(1)}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap bg-blue-50 font-bold text-blue-900">
                    {finalDay !== null ? finalDay.toFixed(1) : '—'}
                  </td>
                </tr>

                {/* Noc */}
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">Noc (22-6h)</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {measuredNight > 0 ? measuredNight.toFixed(1) : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {countingNoiseNight ? countingNoiseNight.LAeq.toFixed(1) : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {rpdiNoiseNight ? rpdiNoiseNight.LAeq.toFixed(1) : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {differenceNight !== null ? (
                      <span
                        className={differenceNight > 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}
                      >
                        {differenceNight > 0 ? '+' : ''}
                        {differenceNight.toFixed(1)}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap bg-blue-50 font-bold text-blue-900">
                    {finalNight !== null ? finalNight.toFixed(1) : '—'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800 font-medium">
            ⚠️ Pro výpočet hluku je nutné načíst sčítání dopravy a vypočítat RPDI v záložce &quot;Sčítání&quot;
          </p>
        </div>
      )}

      {/* Metodika */}
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">ℹ️ Metodika výpočtu</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p>
            <strong>Vzorec:</strong> L<sub>Aeq,T</sub> = 10·log₁₀[Σ N<sub>i</sub>·10<sup>(Lw<sub>i</sub>/10)</sup>] -
            10·log₁₀(d) - 8
          </p>
          <p>
            <strong>Emisní hladiny (50 km/h):</strong> Kategorie 1 (OA+LN+M) = 63 dB(A), Kategorie 2 (N+A) = 74 dB(A),
            Kategorie 3 (K) = 78 dB(A)
          </p>
          <p>
            <strong>Korekce rychlosti:</strong> Lw = L₀ + 30·log₁₀(v/50)
          </p>
          <p>
            <strong>Normy:</strong> ČSN ISO 9613-2, Metodika Ministerstva dopravy ČR
          </p>
        </div>
      </div>
    </div>
  );
}
