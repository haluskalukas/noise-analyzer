'use client';

import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea,
} from 'recharts';
import { VibrationDataPoint } from '@/types/vibration';
import { format } from 'date-fns';

interface VibrationChartProps {
  data: VibrationDataPoint[];
  onTrainSelection?: (startIdx: number, endIdx: number, points: VibrationDataPoint[]) => void;
}

export function VibrationChart({ data, onTrainSelection }: VibrationChartProps) {
  const [refAreaLeft, setRefAreaLeft] = useState<number | null>(null);
  const [refAreaRight, setRefAreaRight] = useState<number | null>(null);
  const [selectedAxis, setSelectedAxis] = useState<'X' | 'Y' | 'Z'>('Z');

  // Calculate summary value for each point (for visualization)
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map((point, index) => {
      // For X axis: indices 0-19
      // For Y axis: indices 20-39
      // For Z axis: indices 40-59
      let startIdx = 0;
      if (selectedAxis === 'Y') startIdx = 20;
      if (selectedAxis === 'Z') startIdx = 40;

      // Calculate logarithmic average for selected axis
      const axisValues = point.frequencies.slice(startIdx, startIdx + 20);
      const validValues = axisValues.filter(v => !isNaN(v) && isFinite(v) && v > 0);

      let avgValue = 0;
      if (validValues.length > 0) {
        const sumOfPowers = validValues.reduce((sum, db) => sum + Math.pow(10, db / 10), 0);
        avgValue = 10 * Math.log10(sumOfPowers / validValues.length);
      }

      return {
        index,
        time: format(point.datetime, 'HH:mm:ss'),
        value: isFinite(avgValue) ? avgValue : 0,
        datetime: point.datetime,
      };
    });
  }, [data, selectedAxis]);

  const handleMouseDown = (e: any) => {
    if (e && e.activeLabel !== undefined && e.nativeEvent?.altKey) {
      setRefAreaLeft(e.activeLabel);
      setRefAreaRight(e.activeLabel);
    }
  };

  const handleMouseMove = (e: any) => {
    if (refAreaLeft !== null && e && e.activeLabel !== undefined) {
      setRefAreaRight(e.activeLabel);
    }
  };

  const handleMouseUp = () => {
    if (refAreaLeft !== null && refAreaRight !== null && onTrainSelection) {
      const left = Math.min(refAreaLeft, refAreaRight);
      const right = Math.max(refAreaLeft, refAreaRight);

      if (left !== right) {
        onTrainSelection(left, right, data);
      }
    }

    setRefAreaLeft(null);
    setRefAreaRight(null);
  };

  const minValue = useMemo(() => {
    if (chartData.length === 0) return 0;
    const values = chartData.map(d => d.value).filter(v => !isNaN(v) && isFinite(v));
    if (values.length === 0) return 0;
    return Math.min(...values) - 5;
  }, [chartData]);

  const maxValue = useMemo(() => {
    if (chartData.length === 0) return 100;
    const values = chartData.map(d => d.value).filter(v => !isNaN(v) && isFinite(v));
    if (values.length === 0) return 100;
    return Math.max(...values) + 5;
  }, [chartData]);

  return (
    <div className="space-y-4">
      {/* Axis Selector */}
      <div className="flex gap-3 bg-gray-50 p-4 rounded-lg">
        <span className="text-sm font-medium text-gray-700">Zobrazit osu:</span>
        <AxisButton
          active={selectedAxis === 'X'}
          onClick={() => setSelectedAxis('X')}
          label="X (podélná)"
        />
        <AxisButton
          active={selectedAxis === 'Y'}
          onClick={() => setSelectedAxis('Y')}
          label="Y (příčná)"
        />
        <AxisButton
          active={selectedAxis === 'Z'}
          onClick={() => setSelectedAxis('Z')}
          label="Z (svislá)"
        />
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={500}>
        <LineChart
          data={chartData}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="time"
            label={{ value: 'Čas', position: 'insideBottom', offset: -5 }}
          />
          <YAxis
            domain={[minValue, maxValue]}
            label={{ value: `Vibrace - osa ${selectedAxis} (dB)`, angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload || !payload[0]) return null;
              const data = payload[0].payload;
              return (
                <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
                  <p className="text-sm font-medium">{data.time}</p>
                  <p className="text-sm text-emerald-600">
                    Hodnota: {data.value.toFixed(1)} dB
                  </p>
                </div>
              );
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            name={`Osa ${selectedAxis}`}
          />

          {refAreaLeft !== null && refAreaRight !== null && (
            <ReferenceArea
              x1={refAreaLeft}
              x2={refAreaRight}
              strokeOpacity={0.3}
              fill="#10b981"
              fillOpacity={0.3}
            />
          )}
        </LineChart>
      </ResponsiveContainer>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>💡 Tip:</strong> Drž <kbd className="px-2 py-1 bg-white rounded border border-blue-300 font-mono text-xs">Alt/Option</kbd> a táhni myší v grafu pro výběr průjezdu vlaku.
        </p>
      </div>
    </div>
  );
}

function AxisButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
        active
          ? 'bg-emerald-600 text-white'
          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
      }`}
    >
      {label}
    </button>
  );
}
