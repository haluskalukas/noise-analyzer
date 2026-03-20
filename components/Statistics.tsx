'use client';

import { NoiseStats } from '@/types';

interface StatisticsProps {
  stats: NoiseStats;
}

export function Statistics({ stats }: StatisticsProps) {
  return (
    <div className="space-y-6">
      {/* Overall Statistics */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Celková statistika</h3>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
            ⚠️ Průměr počítán logaritmicky (L<sub>eq</sub>)
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard label="Minimum" value={`${stats.min.toFixed(1)} dB`} color="green" />
          <StatCard label="Maximum" value={`${stats.max.toFixed(1)} dB`} color="red" />
          <StatCard label="L_eq (Průměr)" value={`${stats.avg.toFixed(1)} dB`} color="blue" />
          <StatCard label="Medián" value={`${stats.median.toFixed(1)} dB`} color="gray" />
          <StatCard label="L_10 (10. percentil)" value={`${stats.p10.toFixed(1)} dB`} color="gray" />
          <StatCard label="L_90 (90. percentil)" value={`${stats.p90.toFixed(1)} dB`} color="gray" />
        </div>
      </div>

      {/* Day/Night Comparison */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Denní vs. Noční doba</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">☀️</span>
              <span className="text-sm font-medium text-gray-700">Den (6:00 - 22:00)</span>
            </div>
            <p className="text-3xl font-bold text-orange-600">{stats.dayAvg.toFixed(1)} dB</p>
          </div>
          <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🌙</span>
              <span className="text-sm font-medium text-gray-700">Noc (22:00 - 6:00)</span>
            </div>
            <p className="text-3xl font-bold text-indigo-600">{stats.nightAvg.toFixed(1)} dB</p>
          </div>
        </div>
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>Rozdíl:</strong>{' '}
            <span className={stats.dayAvg > stats.nightAvg ? 'text-orange-600' : 'text-indigo-600'}>
              {Math.abs(stats.dayAvg - stats.nightAvg).toFixed(1)} dB{' '}
              ({stats.dayAvg > stats.nightAvg ? 'den je hlučnější' : 'noc je hlučnější'})
            </span>
          </p>
        </div>
      </div>

      {/* Hourly Averages */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Hodinové průměry (logaritmické)</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hodina
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  L<sub>eq</sub>
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Min
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  L<sub>5</sub>
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  L<sub>10</sub>
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  L<sub>90</sub>
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  L<sub>95</sub>
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Max
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  n
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.hourlyAvgs.map((hourly) => (
                <tr key={hourly.hour} className={hourly.hour >= 6 && hourly.hour < 22 ? '' : 'bg-blue-50'}>
                  <td className="px-3 py-3 whitespace-nowrap font-medium text-gray-900">
                    {hourly.hour.toString().padStart(2, '0')}:00
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-gray-700 font-semibold">
                    {hourly.avg.toFixed(1)}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-green-600">
                    {hourly.min.toFixed(1)}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-gray-600">
                    {hourly.p5.toFixed(1)}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-gray-600">
                    {hourly.p10.toFixed(1)}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-gray-600">
                    {hourly.p90.toFixed(1)}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-gray-600">
                    {hourly.p95.toFixed(1)}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-red-600">
                    {hourly.max.toFixed(1)}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-gray-500">
                    {hourly.count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 space-y-1 text-xs text-gray-600">
          <p><strong>L<sub>eq</sub></strong> = ekvivalentní hladina hluku (logaritmický průměr)</p>
          <p><strong>Percentily (akustická notace):</strong></p>
          <ul className="ml-4 space-y-0.5">
            <li><strong>L<sub>5</sub></strong> = 5% času je hluk vyšší (špičky)</li>
            <li><strong>L<sub>10</sub></strong> = 10% času je hluk vyšší</li>
            <li><strong>L<sub>90</sub></strong> = 90% času je hluk vyšší (pozadí)</li>
            <li><strong>L<sub>95</sub></strong> = 95% času je hluk vyšší (minimum)</li>
          </ul>
          <p><strong>n</strong> = počet měření</p>
          <p className="text-blue-600">🌙 Modrá = noční doba (22:00-6:00)</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colors = {
    green: 'bg-green-50 border-green-200 text-green-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    gray: 'bg-gray-50 border-gray-200 text-gray-700',
  };

  return (
    <div className={`p-4 rounded-lg border ${colors[color as keyof typeof colors]}`}>
      <p className="text-xs font-medium opacity-75 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
