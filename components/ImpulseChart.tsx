'use client';

import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { format } from 'date-fns';
import { ImpulseData } from '@/app/impulzni-hluk/page';

interface ImpulseChartProps {
  data: ImpulseData[];
}

export default function ImpulseChart({ data }: ImpulseChartProps) {
  const [showLAeq, setShowLAeq] = useState(true);
  const [showLASmax, setShowLASmax] = useState(true);

  if (data.length === 0) return null;

  // Prepare chart data
  const chartData = data.map((d, index) => ({
    index: index + 1,
    timestamp: format(d.timestamp, 'dd.MM.yyyy HH:mm'),
    lAImax: d.lAImax,
    lASmax: d.lASmax,
    lAeq: d.lAeq,
    difference: d.lAImax - d.lASmax,
    isHighlyImpulsive: d.isHighlyImpulsive,
  }));

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">📈 Časový průběh</h2>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showLASmax}
              onChange={(e) => setShowLASmax(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-700">Zobrazit L<sub>ASmax</sub></span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showLAeq}
              onChange={(e) => setShowLAeq(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-700">Zobrazit L<sub>Aeq</sub></span>
          </label>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={500}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="index"
            label={{ value: 'Číslo události', position: 'insideBottom', offset: -5 }}
            stroke="#6b7280"
          />
          <YAxis
            label={{ value: 'Hladina [dB(A)]', angle: -90, position: 'insideLeft' }}
            stroke="#6b7280"
            domain={[60, 140]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px',
            }}
            formatter={(value: any, name: any) => {
              if (name === 'lAImax') return [value + ' dB(A)', 'LAImax'];
              if (name === 'lASmax') return [value + ' dB(A)', 'LASmax'];
              if (name === 'lAeq') return [value + ' dB(A)', 'LAeq'];
              return [value, name];
            }}
            labelFormatter={(label: any, payload: any) => {
              if (payload && payload[0]) {
                const p = payload[0].payload;
                const diff = (p.lAImax - p.lASmax).toFixed(1);
                const status = p.isHighlyImpulsive ? '💥 Vysoce impulsní' : '';
                return `Událost #${label} - ${p.timestamp} ${status}\nRozdíl: ${diff} dB`;
              }
              return label;
            }}
          />
          <Legend
            verticalAlign="top"
            height={36}
            formatter={(value) => {
              if (value === 'lAImax') return 'LAImax [dB(A)]';
              if (value === 'lASmax') return 'LASmax [dB(A)]';
              if (value === 'lAeq') return 'LAeq [dB(A)]';
              return value;
            }}
          />

          {/* Reference line for identification threshold */}
          <ReferenceLine
            y={5}
            stroke="#dc2626"
            strokeDasharray="5 5"
            label={{
              value: 'Práh identifikace: rozdíl 5 dB',
              position: 'right',
              fill: '#dc2626',
              fontSize: 11,
            }}
            ifOverflow="extendDomain"
          />

          {/* Data lines */}
          <Line
            type="monotone"
            dataKey="lAImax"
            stroke="#dc2626"
            strokeWidth={2}
            dot={(props: any) => {
              const { cx, cy, payload } = props;
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={payload.isHighlyImpulsive ? 6 : 4}
                  fill={payload.isHighlyImpulsive ? '#dc2626' : '#ef4444'}
                  stroke={payload.isHighlyImpulsive ? '#991b1b' : '#dc2626'}
                  strokeWidth={payload.isHighlyImpulsive ? 2 : 1}
                />
              );
            }}
            activeDot={{ r: 8 }}
          />

          {showLASmax && (
            <Line
              type="monotone"
              dataKey="lASmax"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 4, fill: '#3b82f6' }}
              activeDot={{ r: 6 }}
            />
          )}

          {showLAeq && (
            <Line
              type="monotone"
              dataKey="lAeq"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 4, fill: '#10b981' }}
              activeDot={{ r: 6 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>

      {/* Chart Legend */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-3 text-sm">📊 Legenda:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-12 h-1 bg-red-600 rounded"></div>
            <span className="text-gray-700">
              <strong>L<sub>AImax</sub></strong> - Maximum Impulse [dB(A)]
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-12 h-1 bg-blue-500 rounded"></div>
            <span className="text-gray-700">
              <strong>L<sub>ASmax</sub></strong> - Maximum Slow [dB(A)]
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-12 h-1 bg-green-500 rounded"></div>
            <span className="text-gray-700">
              <strong>L<sub>Aeq</sub></strong> - Ekvivalentní hladina [dB(A)]
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-600 rounded-full border-2 border-red-900"></div>
            <span className="text-gray-700">💥 Vysoce impulsní (rozdíl {'>'} 5 dB)</span>
          </div>
        </div>
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-xs text-blue-900">
            <strong>ℹ️ Identifikace:</strong> Pokud je rozdíl LAImax - LASmax {'>'} 5 dB,
            hluk je vysoce impulsní (označeno větším červeným bodem s tmavším okrajem).
            Pro tyto události se aplikuje korekce -12 dB k hygienickému limitu.
          </p>
        </div>
      </div>
    </div>
  );
}
