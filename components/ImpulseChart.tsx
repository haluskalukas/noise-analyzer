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
  if (data.length === 0) return null;

  // Calculate day/night averages
  const daytimeData = data.filter((d) => d.isDaytime);
  const nighttimeData = data.filter((d) => !d.isDaytime);

  const avgDaytimeLAeqCorrected = daytimeData.length > 0
    ? daytimeData.reduce((sum, d) => sum + d.lAeqCorrected, 0) / daytimeData.length
    : 0;

  const avgNighttimeLAeqCorrected = nighttimeData.length > 0
    ? nighttimeData.reduce((sum, d) => sum + d.lAeqCorrected, 0) / nighttimeData.length
    : 0;

  // Prepare chart data
  const chartData = data.map((d, index) => ({
    index: index + 1,
    timestamp: format(d.timestamp, 'dd.MM HH:mm'),
    lAeqCorrected: d.lAeqCorrected,
    isDaytime: d.isDaytime,
    difference: d.difference,
  }));

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">📈 LAeq korigovaný - časový průběh</h2>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="index"
            label={{ value: 'Číslo impulsu', position: 'insideBottom', offset: -5 }}
            stroke="#6b7280"
          />
          <YAxis
            label={{ value: 'LAeq korigovaný [dB(A)]', angle: -90, position: 'insideLeft' }}
            stroke="#6b7280"
            domain={[50, 110]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px',
            }}
            formatter={(value: any, name: any) => {
              if (name === 'lAeqCorrected') return [value.toFixed(1) + ' dB(A)', 'LAeq korigovaný'];
              return [value, name];
            }}
            labelFormatter={(label: any, payload: any) => {
              if (payload && payload[0]) {
                const p = payload[0].payload;
                const time = p.isDaytime ? '☀️ Den' : '🌙 Noc';
                return `Impuls #${label} - ${p.timestamp}\n${time} • Rozdíl: ${p.difference.toFixed(1)} dB`;
              }
              return label;
            }}
          />
          <Legend
            verticalAlign="top"
            height={36}
            formatter={(value) => {
              if (value === 'lAeqCorrected') return 'LAeq korigovaný [dB(A)]';
              return value;
            }}
          />

          {/* Reference lines for day/night averages */}
          {avgDaytimeLAeqCorrected > 0 && (
            <ReferenceLine
              y={avgDaytimeLAeqCorrected}
              stroke="#f59e0b"
              strokeDasharray="5 5"
              label={{
                value: `☀️ Průměr den: ${avgDaytimeLAeqCorrected.toFixed(1)} dB(A)`,
                position: 'right',
                fill: '#f59e0b',
                fontSize: 11,
              }}
            />
          )}
          {avgNighttimeLAeqCorrected > 0 && (
            <ReferenceLine
              y={avgNighttimeLAeqCorrected}
              stroke="#3b82f6"
              strokeDasharray="5 5"
              label={{
                value: `🌙 Průměr noc: ${avgNighttimeLAeqCorrected.toFixed(1)} dB(A)`,
                position: 'right',
                fill: '#3b82f6',
                fontSize: 11,
              }}
            />
          )}

          {/* Data line */}
          <Line
            type="monotone"
            dataKey="lAeqCorrected"
            stroke="#10b981"
            strokeWidth={2}
            dot={(props: any) => {
              const { cx, cy, payload } = props;
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={5}
                  fill={payload.isDaytime ? '#10b981' : '#3b82f6'}
                  stroke={payload.isDaytime ? '#059669' : '#2563eb'}
                  strokeWidth={2}
                />
              );
            }}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Summary boxes */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Daytime summary */}
        {daytimeData.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-900 mb-2">☀️ Denní doba (6:00-22:00)</h4>
            <div className="text-sm text-yellow-800 space-y-1">
              <div className="flex justify-between">
                <span>Počet impulsů:</span>
                <span className="font-bold">{daytimeData.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Průměr LAeq korigovaný:</span>
                <span className="font-bold">{avgDaytimeLAeqCorrected.toFixed(1)} dB(A)</span>
              </div>
            </div>
          </div>
        )}

        {/* Nighttime summary */}
        {nighttimeData.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">🌙 Noční doba (22:00-6:00)</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <div className="flex justify-between">
                <span>Počet impulsů:</span>
                <span className="font-bold">{nighttimeData.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Průměr LAeq korigovaný:</span>
                <span className="font-bold">{avgNighttimeLAeqCorrected.toFixed(1)} dB(A)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-700">
          <strong>Legenda:</strong> <span className="inline-block w-3 h-3 bg-green-500 rounded-full border border-green-700 mx-1"></span> Denní doba •
          <span className="inline-block w-3 h-3 bg-blue-500 rounded-full border border-blue-700 mx-1"></span> Noční doba •
          Čárované linie = průměry pro den/noc
        </p>
      </div>
    </div>
  );
}
