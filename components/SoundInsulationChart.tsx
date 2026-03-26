'use client';

import { useRef, useEffect, useState } from 'react';
import { FrequencyMeasurement, RoomParameters, REFERENCE_CURVE, calculateWeightedIndex, FrequencyResult } from '@/app/nepruzvucnost/page';

interface SoundInsulationChartProps {
  measurements: FrequencyMeasurement[];
  roomParams: RoomParameters;
  shift?: number; // Volitelný manuální posun křivky pro demonstraci
}

interface CalculatedResult {
  frequency: number;
  A: number;    // Ekvivalentní pohltivá plocha [m²]
  R: number;    // Stavební neprůzvučnost R' [dB]
  DnT: number;  // Normovaný rozdíl hladin [dB]
}

export default function SoundInsulationChart({ measurements, roomParams, shift }: SoundInsulationChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; data: string } | null>(null);
  const [visibleLines, setVisibleLines] = useState({
    R: true,
    DnT: true,
    reference: true,
  });

  // Výpočet A, R', DnT
  const calculateResults = (): CalculatedResult[] => {
    return measurements.map((m) => {
      // A = 0.163 × V / T [m²]
      const A = (0.163 * roomParams.volume) / m.T;

      // R' = L1 - L2 + 10 × log(S/A) [dB]
      const R = m.L1 - m.L2 + 10 * Math.log10(roomParams.area / A);

      // DnT = L1 - L2 + 10 × log(T/0.5) [dB]
      const DnT = m.L1 - m.L2 + 10 * Math.log10(m.T / 0.5);

      return { frequency: m.frequency, A, R, DnT };
    });
  };

  const results = calculateResults();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High DPI support
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Clear
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Padding
    const padding = { top: 40, right: 60, bottom: 60, left: 70 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Find min/max for axes
    const allRValues = results.map(r => r.R);
    const allDnTValues = results.map(r => r.DnT);
    const allYValues = [...allRValues, ...allDnTValues];
    const minY = Math.floor(Math.min(...allYValues) / 10) * 10;
    const maxY = Math.ceil(Math.max(...allYValues) / 10) * 10;

    const frequencies = results.map(r => r.frequency);
    const minFreq = Math.min(...frequencies);
    const maxFreq = Math.max(...frequencies);

    // Logarithmic scale for X (frequency)
    const freqToX = (freq: number) => {
      const logMin = Math.log10(minFreq);
      const logMax = Math.log10(maxFreq);
      const logFreq = Math.log10(freq);
      return padding.left + ((logFreq - logMin) / (logMax - logMin)) * chartWidth;
    };

    // Linear scale for Y (dB)
    const dbToY = (db: number) => {
      return padding.top + chartHeight - ((db - minY) / (maxY - minY)) * chartHeight;
    };

    // Draw grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;

    // Horizontal grid lines (dB)
    for (let db = minY; db <= maxY; db += 5) {
      const y = dbToY(db);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      // Y-axis labels
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px system-ui';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${db} dB`, padding.left - 10, y);
    }

    // Vertical grid lines (frequencies)
    const standardFrequencies = [50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000];
    standardFrequencies.forEach((freq) => {
      if (freq >= minFreq && freq <= maxFreq) {
        const x = freqToX(freq);
        ctx.beginPath();
        ctx.moveTo(x, padding.top);
        ctx.lineTo(x, height - padding.bottom);
        ctx.stroke();

        // X-axis labels (only show some to avoid crowding)
        if ([50, 100, 200, 500, 1000, 2000, 5000].includes(freq)) {
          ctx.fillStyle = '#6b7280';
          ctx.font = '12px system-ui';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(`${freq}`, x, height - padding.bottom + 10);
        }
      }
    });

    // Draw axes
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 14px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Frekvence [Hz]', padding.left + chartWidth / 2, height - 25);

    ctx.save();
    ctx.translate(20, padding.top + chartHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Neprůzvučnost [dB]', 0, 0);
    ctx.restore();

    // Draw lines
    const drawLine = (data: CalculatedResult[], key: 'R' | 'DnT', color: string, label: string) => {
      if (!visibleLines[key]) return;

      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();

      data.forEach((point, i) => {
        const x = freqToX(point.frequency);
        const y = dbToY(point[key]);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      // Draw points
      ctx.fillStyle = color;
      data.forEach((point) => {
        const x = freqToX(point.frequency);
        const y = dbToY(point[key]);
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
      });
    };

    // Draw R' line
    drawLine(results, 'R', '#3b82f6', "R'");

    // Draw DnT line
    drawLine(results, 'DnT', '#10b981', 'DnT');

    // Draw reference curve
    if (visibleLines.reference) {
      // Vypočítat optimální posun pokud není zadán manuálně
      const resultsForCalc: FrequencyResult[] = results.map(r => ({
        ...r,
        L1: 0,
        L2: 0,
        T: 0,
        A: r.A
      }));
      const weightedIndex = calculateWeightedIndex(resultsForCalc);
      const curveShift = shift !== undefined ? shift : weightedIndex.shift;

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]); // Čárkovaná čára
      ctx.beginPath();

      const refFrequencies = Object.keys(REFERENCE_CURVE).map(Number).sort((a, b) => a - b);
      refFrequencies.forEach((freq, i) => {
        const refValue = REFERENCE_CURVE[freq] + curveShift;
        const x = freqToX(freq);
        const y = dbToY(refValue);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
      ctx.setLineDash([]); // Reset na plnou čáru

      // Draw reference points (menší body)
      ctx.fillStyle = '#ef4444';
      refFrequencies.forEach((freq) => {
        const refValue = REFERENCE_CURVE[freq] + curveShift;
        const x = freqToX(freq);
        const y = dbToY(refValue);
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, 2 * Math.PI);
        ctx.fill();
      });
    }

    // Legend
    const legendX = width - padding.right - 100;
    const legendY = padding.top + 20;
    const lineHeight = 25;

    ctx.font = '13px system-ui';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const legendItems = [
      { key: 'R' as const, color: '#3b82f6', label: "R' - Stavební neprůzvučnost" },
      { key: 'DnT' as const, color: '#10b981', label: "DnT - Normovaný rozdíl hladin" },
      { key: 'reference' as const, color: '#ef4444', label: "Referenční křivka ISO 717-1" },
    ];

    legendItems.forEach((item, i) => {
      const y = legendY + i * lineHeight;
      const opacity = visibleLines[item.key] ? 1 : 0.3;

      ctx.globalAlpha = opacity;

      // Color box
      ctx.fillStyle = item.color;
      ctx.fillRect(legendX, y - 6, 20, 12);

      // Label
      ctx.fillStyle = '#1f2937';
      ctx.fillText(item.label, legendX + 28, y);

      ctx.globalAlpha = 1;
    });

  }, [measurements, roomParams, results, visibleLines]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if click is on legend
    const padding = { top: 40, right: 60, bottom: 60, left: 70 };
    const legendX = rect.width - padding.right - 100;
    const legendY = padding.top + 20;
    const lineHeight = 25;

    const legendItems: Array<'R' | 'DnT' | 'reference'> = ['R', 'DnT', 'reference'];

    legendItems.forEach((key, i) => {
      const itemY = legendY + i * lineHeight;
      if (x >= legendX && x <= legendX + 250 && y >= itemY - 10 && y <= itemY + 10) {
        setVisibleLines((prev) => ({ ...prev, [key]: !prev[key] }));
      }
    });
  };

  const handleCanvasHover = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const padding = { top: 40, right: 60, bottom: 60, left: 70 };
    const chartWidth = rect.width - padding.left - padding.right;
    const chartHeight = rect.height - padding.top - padding.bottom;

    const frequencies = results.map(r => r.frequency);
    const minFreq = Math.min(...frequencies);
    const maxFreq = Math.max(...frequencies);

    const allRValues = results.map(r => r.R);
    const allDnTValues = results.map(r => r.DnT);
    const allYValues = [...allRValues, ...allDnTValues];
    const minY = Math.floor(Math.min(...allYValues) / 10) * 10;
    const maxY = Math.ceil(Math.max(...allYValues) / 10) * 10;

    const freqToX = (freq: number) => {
      const logMin = Math.log10(minFreq);
      const logMax = Math.log10(maxFreq);
      const logFreq = Math.log10(freq);
      return padding.left + ((logFreq - logMin) / (logMax - logMin)) * chartWidth;
    };

    const dbToY = (db: number) => {
      return padding.top + chartHeight - ((db - minY) / (maxY - minY)) * chartHeight;
    };

    // Find closest point
    let closestPoint: { x: number; y: number; data: string } | null = null;
    let minDistance = 15; // Max distance to show tooltip

    results.forEach((point) => {
      if (visibleLines.R) {
        const x = freqToX(point.frequency);
        const y = dbToY(point.R);
        const distance = Math.sqrt(Math.pow(mouseX - x, 2) + Math.pow(mouseY - y, 2));

        if (distance < minDistance) {
          minDistance = distance;
          closestPoint = {
            x,
            y,
            data: `${point.frequency} Hz\nR' = ${point.R.toFixed(1)} dB`,
          };
        }
      }

      if (visibleLines.DnT) {
        const x = freqToX(point.frequency);
        const y = dbToY(point.DnT);
        const distance = Math.sqrt(Math.pow(mouseX - x, 2) + Math.pow(mouseY - y, 2));

        if (distance < minDistance) {
          minDistance = distance;
          closestPoint = {
            x,
            y,
            data: `${point.frequency} Hz\nDnT = ${point.DnT.toFixed(1)} dB`,
          };
        }
      }
    });

    setHoveredPoint(closestPoint);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">
          📊 Frekvenční charakteristika neprůzvučnosti
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setVisibleLines((prev) => ({ ...prev, R: !prev.R }))}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              visibleLines.R
                ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                : 'bg-gray-100 text-gray-500 border-2 border-gray-300'
            }`}
          >
            R'
          </button>
          <button
            onClick={() => setVisibleLines((prev) => ({ ...prev, DnT: !prev.DnT }))}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              visibleLines.DnT
                ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-500'
                : 'bg-gray-100 text-gray-500 border-2 border-gray-300'
            }`}
          >
            DnT
          </button>
          <button
            onClick={() => setVisibleLines((prev) => ({ ...prev, reference: !prev.reference }))}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              visibleLines.reference
                ? 'bg-red-100 text-red-700 border-2 border-red-500'
                : 'bg-gray-100 text-gray-500 border-2 border-gray-300'
            }`}
          >
            ISO 717-1
          </button>
        </div>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          className="w-full cursor-crosshair"
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasHover}
          onMouseLeave={() => setHoveredPoint(null)}
          style={{ maxHeight: '500px' }}
        />

        {/* Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute bg-gray-900 text-white text-xs rounded px-3 py-2 pointer-events-none shadow-lg"
            style={{
              left: `${hoveredPoint.x}px`,
              top: `${hoveredPoint.y - 50}px`,
              transform: 'translateX(-50%)',
              whiteSpace: 'pre-line',
            }}
          >
            {hoveredPoint.data}
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>
          <strong>Klikněte na legendu</strong> pro zapnutí/vypnutí jednotlivých křivek.
          Najeďte myší na body pro zobrazení hodnot.
        </p>
      </div>
    </div>
  );
}
