'use client';

import { ImpulseData, MeasurementData } from '@/app/impulzni-hluk/page';

interface ImpulseInfoBoxesProps {
  impulseData: ImpulseData[];
  allMeasurements?: MeasurementData[];
}

export default function ImpulseInfoBoxes({ impulseData, allMeasurements }: ImpulseInfoBoxesProps) {
  if (impulseData.length === 0) return null;

  // Calculate day/night split for impulses
  const daytimeImpulses = impulseData.filter(d => d.isDaytime);
  const nighttimeImpulses = impulseData.filter(d => !d.isDaytime);

  // Calculate average LAeq for impulses
  const avgDaytimeLAeq = daytimeImpulses.length > 0
    ? daytimeImpulses.reduce((sum, d) => sum + d.lAeq, 0) / daytimeImpulses.length
    : 0;

  const avgNighttimeLAeq = nighttimeImpulses.length > 0
    ? nighttimeImpulses.reduce((sum, d) => sum + d.lAeq, 0) / nighttimeImpulses.length
    : 0;

  // If we have all measurements, calculate total counts
  const totalDaySeconds = allMeasurements ? allMeasurements.filter(m => {
    const hour = m.timestamp.getHours();
    return hour >= 6 && hour < 22;
  }).length : 0;

  const totalNightSeconds = allMeasurements ? allMeasurements.filter(m => {
    const hour = m.timestamp.getHours();
    return hour < 6 || hour >= 22;
  }).length : 0;

  const totalSeconds = allMeasurements ? allMeasurements.length : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Box 1: Total measurements (seconds) */}
      <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-blue-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
            📊
          </div>
          <h3 className="font-semibold text-gray-800">Celkový počet sekund</h3>
        </div>

        {totalSeconds > 0 ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Celkem:</span>
              <span className="text-2xl font-bold text-gray-900">{totalSeconds}</span>
            </div>
            <div className="h-px bg-gray-200"></div>
            <div className="flex justify-between items-center">
              <span className="text-yellow-700 flex items-center gap-1">
                ☀️ Denní doba:
              </span>
              <span className="font-bold text-yellow-800">{totalDaySeconds}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blue-700 flex items-center gap-1">
                🌙 Noční doba:
              </span>
              <span className="font-bold text-blue-800">{totalNightSeconds}</span>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-4">
            <p className="text-sm">Data nejsou k dispozici</p>
            <p className="text-xs mt-1">Zobrazují se pouze impulsy</p>
          </div>
        )}
      </div>

      {/* Box 2: Impulse events (seconds) */}
      <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-red-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-2xl">
            💥
          </div>
          <h3 className="font-semibold text-gray-800">Počet impulsních událostí</h3>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Celkem:</span>
            <span className="text-2xl font-bold text-red-600">{impulseData.length}</span>
          </div>
          <div className="h-px bg-gray-200"></div>
          <div className="flex justify-between items-center">
            <span className="text-yellow-700 flex items-center gap-1">
              ☀️ Denní doba:
            </span>
            <span className="font-bold text-yellow-800">{daytimeImpulses.length}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-blue-700 flex items-center gap-1">
              🌙 Noční doba:
            </span>
            <span className="font-bold text-blue-800">{nighttimeImpulses.length}</span>
          </div>
        </div>

        {totalSeconds > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Podíl impulsů:</span>
                <span className="font-semibold text-red-600">
                  {((impulseData.length / totalSeconds) * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Box 3: Average LAeq of impulses */}
      <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-green-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">
            📈
          </div>
          <h3 className="font-semibold text-gray-800">Průměr L<sub>Aeq</sub> impulsů</h3>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Celkový průměr:</span>
            <span className="text-2xl font-bold text-green-600">
              {(impulseData.reduce((sum, d) => sum + d.lAeq, 0) / impulseData.length).toFixed(1)}
              <span className="text-sm ml-1">dB(A)</span>
            </span>
          </div>
          <div className="h-px bg-gray-200"></div>
          <div className="flex justify-between items-center">
            <span className="text-yellow-700 flex items-center gap-1">
              ☀️ Denní doba:
            </span>
            <span className="font-bold text-yellow-800">
              {daytimeImpulses.length > 0 ? `${avgDaytimeLAeq.toFixed(1)} dB(A)` : '-'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-blue-700 flex items-center gap-1">
              🌙 Noční doba:
            </span>
            <span className="font-bold text-blue-800">
              {nighttimeImpulses.length > 0 ? `${avgNighttimeLAeq.toFixed(1)} dB(A)` : '-'}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-600">
            <div className="flex justify-between mb-1">
              <span>Min LAeq:</span>
              <span className="font-semibold">
                {Math.min(...impulseData.map(d => d.lAeq)).toFixed(1)} dB(A)
              </span>
            </div>
            <div className="flex justify-between">
              <span>Max LAeq:</span>
              <span className="font-semibold">
                {Math.max(...impulseData.map(d => d.lAeq)).toFixed(1)} dB(A)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
