'use client';

import { ImpulseData } from '@/app/impulzni-hluk/page';

interface ImpulseStatisticsProps {
  data: ImpulseData[];
}

export default function ImpulseStatistics({ data }: ImpulseStatisticsProps) {
  if (data.length === 0) return null;

  // Calculate statistics for LAImax
  const lAImaxValues = data.map((d) => d.lAImax).sort((a, b) => a - b);
  const minLAImax = Math.min(...lAImaxValues);
  const maxLAImax = Math.max(...lAImaxValues);
  const avgLAImax = lAImaxValues.reduce((a, b) => a + b, 0) / lAImaxValues.length;
  const medianLAImax = lAImaxValues[Math.floor(lAImaxValues.length / 2)];

  // Calculate statistics for LASmax
  const lASmaxValues = data.map((d) => d.lASmax).sort((a, b) => a - b);
  const minLASmax = Math.min(...lASmaxValues);
  const maxLASmax = Math.max(...lASmaxValues);
  const avgLASmax = lASmaxValues.reduce((a, b) => a + b, 0) / lASmaxValues.length;
  const medianLASmax = lASmaxValues[Math.floor(lASmaxValues.length / 2)];

  // Calculate LAeq statistics
  const lAeqValues = data.map((d) => d.lAeq).sort((a, b) => a - b);
  const minLAeq = Math.min(...lAeqValues);
  const maxLAeq = Math.max(...lAeqValues);
  const avgLAeq = lAeqValues.reduce((a, b) => a + b, 0) / lAeqValues.length;
  const medianLAeq = lAeqValues[Math.floor(lAeqValues.length / 2)];

  // Count highly impulsive events
  const highlyImpulsiveCount = data.filter((d) => d.isHighlyImpulsive).length;

  // Count day/night events
  const daytimeCount = data.filter((d) => d.isDaytime).length;
  const nighttimeCount = data.length - daytimeCount;

  // Calculate average corrected LAeq for day and night
  const daytimeData = data.filter((d) => d.isDaytime);
  const nighttimeData = data.filter((d) => !d.isDaytime);

  const avgDaytimeLAeqCorrected = daytimeData.length > 0
    ? daytimeData.reduce((sum, d) => sum + d.lAeqCorrected, 0) / daytimeData.length
    : 0;

  const avgNighttimeLAeqCorrected = nighttimeData.length > 0
    ? nighttimeData.reduce((sum, d) => sum + d.lAeqCorrected, 0) / nighttimeData.length
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">📊 Statistiky</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Events */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="text-sm font-medium opacity-90 mb-1">Celkem událostí</div>
          <div className="text-3xl font-bold">{data.length}</div>
        </div>

        {/* Highly Impulsive Count */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-6 text-white">
          <div className="text-sm font-medium opacity-90 mb-1">Vysoce impulsní</div>
          <div className="text-3xl font-bold">{highlyImpulsiveCount}</div>
          <div className="text-xs opacity-75 mt-1">LAImax - LASmax {'>'} 5 dB</div>
        </div>

        {/* Max LAImax */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
          <div className="text-sm font-medium opacity-90 mb-1">Max L<sub>AImax</sub></div>
          <div className="text-3xl font-bold">{maxLAImax.toFixed(1)}</div>
          <div className="text-xs opacity-75 mt-1">dB(A)</div>
        </div>

        {/* Avg LAeq */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="text-sm font-medium opacity-90 mb-1">Průměr L<sub>Aeq</sub></div>
          <div className="text-3xl font-bold">{avgLAeq.toFixed(1)}</div>
          <div className="text-xs opacity-75 mt-1">dB(A)</div>
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* LAImax Statistics */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-4">
            L<sub>AImax</sub> - Impulse [dB(A)]
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Minimum:</span>
              <span className="font-bold text-gray-900">{minLAImax.toFixed(1)} dB(A)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Maximum:</span>
              <span className="font-bold text-gray-900">{maxLAImax.toFixed(1)} dB(A)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Průměr:</span>
              <span className="font-bold text-gray-900">{avgLAImax.toFixed(1)} dB(A)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Medián:</span>
              <span className="font-bold text-gray-900">{medianLAImax.toFixed(1)} dB(A)</span>
            </div>
          </div>
        </div>

        {/* LASmax Statistics */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-4">
            L<sub>ASmax</sub> - Slow [dB(A)]
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Minimum:</span>
              <span className="font-bold text-gray-900">{minLASmax.toFixed(1)} dB(A)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Maximum:</span>
              <span className="font-bold text-gray-900">{maxLASmax.toFixed(1)} dB(A)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Průměr:</span>
              <span className="font-bold text-gray-900">{avgLASmax.toFixed(1)} dB(A)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Medián:</span>
              <span className="font-bold text-gray-900">{medianLASmax.toFixed(1)} dB(A)</span>
            </div>
          </div>
        </div>

        {/* LAeq Statistics */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-4">
            L<sub>Aeq</sub> - Ekvivalentní [dB(A)]
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Minimum:</span>
              <span className="font-bold text-gray-900">{minLAeq.toFixed(1)} dB(A)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Maximum:</span>
              <span className="font-bold text-gray-900">{maxLAeq.toFixed(1)} dB(A)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Průměr:</span>
              <span className="font-bold text-gray-900">{avgLAeq.toFixed(1)} dB(A)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Medián:</span>
              <span className="font-bold text-gray-900">{medianLAeq.toFixed(1)} dB(A)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Identification */}
      <div className="mt-6 border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-800 mb-4">🔬 Identifikace vysoce impulsního hluku</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Vysoce impulsní hluk (LAImax - LASmax {'>'} 5 dB):</span>
            <span className="font-bold text-gray-900">
              {highlyImpulsiveCount} / {data.length}
              <span className="text-sm text-gray-600 ml-2">
                ({((highlyImpulsiveCount / data.length) * 100).toFixed(0)}%)
              </span>
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Maximální rozdíl LAImax - LASmax:</span>
            <span className="font-bold text-gray-900">
              {Math.max(...data.map(d => d.lAImax - d.lASmax)).toFixed(1)} dB
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Průměrný rozdíl LAImax - LASmax:</span>
            <span className="font-bold text-gray-900">
              {(data.reduce((sum, d) => sum + (d.lAImax - d.lASmax), 0) / data.length).toFixed(1)} dB
            </span>
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <p className="text-xs text-blue-900 mb-2">
            <strong>📋 Podle NV 272/2011 Sb. - Příloha č. 4:</strong>
          </p>
          <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
            <li>Pro vysoce impulsní hluk se aplikuje korekce <strong>-12 dB</strong> k hygienickému limitu</li>
            <li>Identifikace: rozdíl LAImax - LASmax {'>'} 5 dB</li>
            <li>LAeq korigováno na zbytkový hluk (průměr 1s před a po impulsu)</li>
          </ul>
        </div>
      </div>

      {/* Day/Night Distribution */}
      <div className="mt-6 border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-800 mb-4">🌞 Rozdělení den/noc</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Daytime */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-900 mb-3">☀️ Denní doba (6:00-22:00)</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-yellow-800">Počet impulsů:</span>
                <span className="font-bold text-yellow-900">{daytimeCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-800">Průměr LAeq korigovaný:</span>
                <span className="font-bold text-yellow-900">
                  {avgDaytimeLAeqCorrected > 0 ? `${avgDaytimeLAeqCorrected.toFixed(1)} dB(A)` : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Nighttime */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-3">🌙 Noční doba (22:00-6:00)</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-800">Počet impulsů:</span>
                <span className="font-bold text-blue-900">{nighttimeCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-800">Průměr LAeq korigovaný:</span>
                <span className="font-bold text-blue-900">
                  {avgNighttimeLAeqCorrected > 0 ? `${avgNighttimeLAeqCorrected.toFixed(1)} dB(A)` : '-'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
