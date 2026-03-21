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

  // Calculate summary value for each point (for visualization)
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Downsample if too many points (max 2000 points for performance)
    const MAX_POINTS = 2000;
    let processedData = data;
    let step = 1;

    if (data.length > MAX_POINTS) {
      step = Math.ceil(data.length / MAX_POINTS);
      processedData = data.filter((_, idx) => idx % step === 0);
    }

    const result = processedData.map((point, index) => {
      // For Z axis: show only 50 Hz frequency (index 57)
      // Frequency 50 Hz is at position 17 in the list (0-indexed)
      // For Z axis (indices 40-59), 50 Hz is at index 40 + 17 = 57
      const freq50HzIndex = 57;

      const value = point.frequencies[freq50HzIndex];
      const validValue = (!isNaN(value) && isFinite(value) && value !== 0) ? value : 0;

      // Debug first point
      if (index === 0) {
        console.log('VibrationChart - First point:', {
          totalFrequencies: point.frequencies.length,
          freq50HzValue: value,
          allFrequencies: point.frequencies,
          validValue,
        });
      }

      return {
        index: index * step,
        time: format(point.datetime, 'HH:mm:ss'),
        value: validValue,
        datetime: point.datetime,
      };
    });

    // Debug chart data
    if (result.length > 0) {
      const nonZeroValues = result.filter(d => d.value !== 0);
      console.log('VibrationChart data:', {
        totalPoints: result.length,
        nonZeroPoints: nonZeroValues.length,
        firstValues: result.slice(0, 5).map(d => d.value),
        sampleTimes: result.slice(0, 3).map(d => d.time),
      });
    }

    return result;
  }, [data]);

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
      {/* Info */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <span className="text-sm font-medium text-gray-700">Zobrazení: Osa Z, frekvence 50 Hz</span>
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
            dataKey="index"
            type="number"
            domain={[0, 'dataMax']}
            tickFormatter={(value) => {
              const point = chartData.find(d => d.index === value);
              return point ? point.time : '';
            }}
            label={{ value: 'Čas', position: 'insideBottom', offset: -5 }}
            interval="preserveStartEnd"
            minTickGap={50}
          />
          <YAxis
            domain={['auto', 'auto']}
            label={{ value: 'Vibrace - osa Z, 50 Hz (dB)', angle: -90, position: 'insideLeft' }}
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
            name="Z osa, 50 Hz"
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
