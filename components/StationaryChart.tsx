'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { StationaryDataPoint, STATIONARY_FREQUENCY_LIST } from '@/types/stationary';
import { format } from 'date-fns';
import { formatNumber } from '@/lib/format';

interface StationaryChartProps {
  data: StationaryDataPoint[];
  onSourceSelection?: (startIdx: number, endIdx: number, points: StationaryDataPoint[]) => void;
}

// Barvy čar jednotlivých pásem (střídají se, aby sousední pásma šla rozlišit)
const BAND_COLORS = [
  '#e11d48', '#ea580c', '#ca8a04', '#16a34a', '#0d9488', '#0284c7', '#7c3aed', '#c026d3',
  '#be123c', '#9a3412', '#4d7c0f', '#047857', '#0e7490', '#1d4ed8', '#6d28d9', '#a21caf',
];
const bandColor = (band: number) => BAND_COLORS[band % BAND_COLORS.length];
const bandLabel = (band: number) => {
  const f = STATIONARY_FREQUENCY_LIST[band];
  return f >= 1000 ? `${(f / 1000).toString().replace('.', ',')} kHz` : `${f.toString().replace('.', ',')} Hz`;
};

export function StationaryChart({ data, onSourceSelection }: StationaryChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'pan' | 'select' | null>(null);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [currentMousePos, setCurrentMousePos] = useState({ x: 0, y: 0 });
  const [panStartValue, setPanStartValue] = useState(0);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 500 });
  const [wheelZoomEnabled, setWheelZoomEnabled] = useState(true);
  const [altKeyPressed, setAltKeyPressed] = useState(false);
  // Zobrazení v grafu: LAeq a vybraná třetinooktávová pásma (indexy 0–30)
  const [showLaeq, setShowLaeq] = useState(true);
  const [selectedBands, setSelectedBands] = useState<number[]>([]);
  const toggleBand = (band: number) =>
    setSelectedBands(prev => (prev.includes(band) ? prev.filter(b => b !== band) : [...prev, band].sort((a, b) => a - b)));

  // Convert data to chart format
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map((point) => {
      const datetime = point.datetime instanceof Date ? point.datetime : new Date(point.datetime);

      return {
        datetime,
        value: point.laeq,
        frequencies: point.frequencies,
        hour: datetime.getHours(),
        minute: datetime.getMinutes(),
      };
    });
  }, [data]);

  // Handle canvas resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        const height = 500;
        setCanvasSize({ width, height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Track Alt/Option key for selection mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.key === 'Alt') {
        setAltKeyPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.altKey || e.key === 'Alt') {
        setAltKeyPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const handleBlur = () => setAltKeyPressed(false);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Prevent scroll when wheel zoom is enabled
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheelNative = (e: WheelEvent) => {
      if (wheelZoomEnabled) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom(prev => Math.max(1, Math.min(100, prev * delta)));
      }
    };

    canvas.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', handleWheelNative);
    };
  }, [wheelZoomEnabled]);

  // Draw chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || chartData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvasSize;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Define margins
    const margin = { top: 40, right: 40, bottom: 80, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Calculate visible range
    const visibleDataPoints = Math.ceil(chartData.length / zoom);
    const maxPan = Math.max(0, chartData.length - visibleDataPoints);
    const currentPan = Math.max(0, Math.min(pan, maxPan));

    const startIdx = Math.floor(currentPan);
    const endIdx = Math.min(chartData.length, startIdx + visibleDataPoints);
    const visibleData = chartData.slice(startIdx, endIdx);

    if (visibleData.length === 0) return;

    // Calculate Y domain (LAeq a vybraná pásma; cyklem, ne Math.min(...) – ten u velkých dat padá)
    let vMin = Infinity;
    let vMax = -Infinity;
    for (const d of visibleData) {
      if (showLaeq || selectedBands.length === 0) {
        if (d.value < vMin) vMin = d.value;
        if (d.value > vMax) vMax = d.value;
      }
      for (const b of selectedBands) {
        const v = d.frequencies?.[b];
        if (v === undefined || !isFinite(v)) continue;
        if (v < vMin) vMin = v;
        if (v > vMax) vMax = v;
      }
    }
    if (!isFinite(vMin) || !isFinite(vMax)) { vMin = 0; vMax = 100; }
    const yMin = Math.floor(vMin - 5);
    const yMax = Math.ceil(vMax + 5);

    // Helper functions
    const xScale = (index: number) => {
      return margin.left + (index / (visibleData.length - 1 || 1)) * chartWidth;
    };

    const yScale = (value: number) => {
      return margin.top + chartHeight - ((value - yMin) / (yMax - yMin)) * chartHeight;
    };

    // Draw grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;

    // Horizontal grid lines
    const ySteps = 6;
    for (let i = 0; i <= ySteps; i++) {
      const value = yMin + (yMax - yMin) * (i / ySteps);
      const y = yScale(value);

      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(width - margin.right, y);
      ctx.stroke();

      // Y axis labels
      ctx.fillStyle = '#4b5563';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(value.toFixed(0), margin.left - 10, y + 4);
    }

    // X axis time labels
    const maxLabels = 10;
    const labelStep = Math.max(1, Math.floor(visibleData.length / maxLabels));

    ctx.fillStyle = '#4b5563';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';

    for (let i = 0; i < visibleData.length; i += labelStep) {
      const x = xScale(i);
      const timeLabel = format(visibleData[i].datetime, 'HH:mm:ss');

      // Vertical grid line
      ctx.strokeStyle = '#e5e7eb';
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, height - margin.bottom);
      ctx.stroke();

      // Time label
      ctx.save();
      ctx.translate(x, height - margin.bottom + 20);
      ctx.rotate(-Math.PI / 4);
      ctx.fillText(timeLabel, 0, 0);
      ctx.restore();
    }

    // Vybraná pásma – při více bodech než pixelů se kreslí obálka min/max na pixel (zachová špičky)
    const drawBand = (band: number) => {
      ctx.strokeStyle = bandColor(band);
      ctx.lineWidth = 1.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      const n = visibleData.length;
      const perPixel = n / Math.max(1, chartWidth);
      let started = false;
      const point = (x: number, v: number) => {
        const y = yScale(v);
        if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
      };
      if (perPixel <= 2) {
        for (let i = 0; i < n; i++) point(xScale(i), visibleData[i].frequencies?.[band] ?? 0);
      } else {
        for (let px = 0; px < chartWidth; px++) {
          const from = Math.floor(px * perPixel);
          const to = Math.min(n, Math.floor((px + 1) * perPixel));
          let lo = Infinity;
          let hi = -Infinity;
          for (let i = from; i < to; i++) {
            const v = visibleData[i].frequencies?.[band] ?? 0;
            if (v < lo) lo = v;
            if (v > hi) hi = v;
          }
          if (!isFinite(lo)) continue;
          point(margin.left + px, lo);
          point(margin.left + px, hi);
        }
      }
      ctx.stroke();
    };
    selectedBands.forEach(drawBand);

    // Draw data line (LAeq)
    if (showLaeq || selectedBands.length === 0) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();

      for (let i = 0; i < visibleData.length; i++) {
        const x = xScale(i);
        const y = yScale(visibleData[i].value);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
    }

    // Draw selection rectangle if dragging in selection mode
    if (isDragging && dragMode === 'select') {
      ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
      ctx.lineWidth = 2;

      const x1 = Math.min(dragStartPos.x, currentMousePos.x);
      const y1 = margin.top;
      const x2 = Math.max(dragStartPos.x, currentMousePos.x);
      const y2 = height - margin.bottom;

      ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

      // Calculate selected time range
      const relativeX1 = Math.max(0, x1 - margin.left);
      const relativeX2 = Math.max(0, x2 - margin.left);

      const index1 = Math.round((relativeX1 / chartWidth) * (visibleData.length - 1));
      const index2 = Math.round((relativeX2 / chartWidth) * (visibleData.length - 1));

      const validIndex1 = Math.max(0, Math.min(index1, visibleData.length - 1));
      const validIndex2 = Math.max(0, Math.min(index2, visibleData.length - 1));

      if (visibleData[validIndex1] && visibleData[validIndex2]) {
        const startTime = format(visibleData[validIndex1].datetime, 'HH:mm:ss');
        const endTime = format(visibleData[validIndex2].datetime, 'HH:mm:ss');

        // Draw start time label
        ctx.fillStyle = 'rgba(59, 130, 246, 0.95)';
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2;

        ctx.font = 'bold 12px sans-serif';
        const startTextWidth = ctx.measureText(startTime).width;
        const startLabelX = x1 - 5;
        const startLabelY = y1 - 10;

        ctx.beginPath();
        ctx.roundRect(startLabelX - startTextWidth - 8, startLabelY - 18, startTextWidth + 16, 24, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(startTime, startLabelX - startTextWidth / 2, startLabelY - 2);

        // Draw end time label
        ctx.fillStyle = 'rgba(59, 130, 246, 0.95)';
        ctx.strokeStyle = '#2563eb';

        const endTextWidth = ctx.measureText(endTime).width;
        const endLabelX = x2 + 5;
        const endLabelY = y1 - 10;

        ctx.beginPath();
        ctx.roundRect(endLabelX - 8, endLabelY - 18, endTextWidth + 16, 24, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(endTime, endLabelX + endTextWidth / 2, endLabelY - 2);
      }
    }

    // Draw axis labels
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Čas', width / 2, height - 10);

    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(selectedBands.length > 0 ? 'Hladina (dB)' : 'LAeq (dB)', 0, 0);
    ctx.restore();

    // Draw hover tooltip
    if (hoveredPoint !== null && hoveredPoint >= 0 && hoveredPoint < visibleData.length) {
      const point = visibleData[hoveredPoint];
      const x = xScale(hoveredPoint);
      const y = yScale(point.value);

      const tooltipText = `LAeq ${formatNumber(point.value)} dB`;
      const time = format(point.datetime, 'HH:mm:ss');
      const bandLines = selectedBands.map(b => ({
        band: b,
        text: `${bandLabel(b)}: ${formatNumber(point.frequencies?.[b] ?? 0)} dB`,
      }));

      ctx.font = '12px sans-serif';
      const textWidth = Math.max(
        ctx.measureText(tooltipText).width,
        ctx.measureText(time).width,
        ...bandLines.map(l => ctx.measureText(l.text).width + 14),
      );

      const tooltipX = Math.min(x + 15, width - margin.right - textWidth - 20);
      const tooltipY = Math.max(margin.top, y - 35);
      const tooltipPadding = 8;

      // Tooltip background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(tooltipX, tooltipY, textWidth + tooltipPadding * 2, 40 + bandLines.length * 16, 6);
      ctx.fill();
      ctx.stroke();

      // Tooltip text - hodnota dB
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(tooltipText, tooltipX + tooltipPadding, tooltipY + 18);

      // Čas pod hodnotou
      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#6b7280';
      ctx.fillText(time, tooltipX + tooltipPadding, tooltipY + 33);

      // Hodnoty vybraných pásem s barevnou značkou
      bandLines.forEach((l, i) => {
        const ly = tooltipY + 50 + i * 16;
        ctx.fillStyle = bandColor(l.band);
        ctx.fillRect(tooltipX + tooltipPadding, ly - 8, 10, 3);
        ctx.fillStyle = '#1f2937';
        ctx.font = '11px sans-serif';
        ctx.fillText(l.text, tooltipX + tooltipPadding + 14, ly - 3);
      });
    }

  }, [chartData, canvasSize, zoom, pan, isDragging, dragMode, dragStartPos, currentMousePos, hoveredPoint, showLaeq, selectedBands]);

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDragging(true);
    setDragStartPos({ x, y });
    setCurrentMousePos({ x, y });

    if (altKeyPressed || e.altKey) {
      setDragMode('select');
    } else {
      setDragMode('pan');
      setPanStartValue(pan);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCurrentMousePos({ x, y });

    if (isDragging) {
      if (dragMode === 'pan') {
        const { width } = canvasSize;
        const margin = { left: 60, right: 40 };
        const chartWidth = width - margin.left - margin.right;

        const dx = x - dragStartPos.x;
        const visibleDataPoints = Math.ceil(chartData.length / zoom);
        const panDelta = -(dx / chartWidth) * visibleDataPoints;

        const newPan = panStartValue + panDelta;
        const maxPan = Math.max(0, chartData.length - visibleDataPoints);
        setPan(Math.max(0, Math.min(newPan, maxPan)));
      }
    } else {
      // Update hovered point
      const margin = { left: 60, right: 40, top: 40, bottom: 80 };
      const chartWidth = canvasSize.width - margin.left - margin.right;

      if (x >= margin.left && x <= canvasSize.width - margin.right) {
        const visibleDataPoints = Math.ceil(chartData.length / zoom);
        const currentPan = Math.max(0, Math.min(pan, Math.max(0, chartData.length - visibleDataPoints)));
        const startIdx = Math.floor(currentPan);
        const endIdx = Math.min(chartData.length, startIdx + visibleDataPoints);
        const visibleData = chartData.slice(startIdx, endIdx);

        const relativeX = x - margin.left;
        const index = Math.round((relativeX / chartWidth) * (visibleData.length - 1));

        if (index >= 0 && index < visibleData.length) {
          setHoveredPoint(index);
        } else {
          setHoveredPoint(null);
        }
      } else {
        setHoveredPoint(null);
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging && dragMode === 'select' && onSourceSelection) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const x1 = dragStartPos.x;
      const x2 = currentMousePos.x;

      const margin = { left: 60, right: 40 };
      const chartWidth = canvasSize.width - margin.left - margin.right;

      const visibleDataPoints = Math.ceil(chartData.length / zoom);
      const currentPan = Math.max(0, Math.min(pan, Math.max(0, chartData.length - visibleDataPoints)));
      const startIdx = Math.floor(currentPan);
      const endIdx = Math.min(chartData.length, startIdx + visibleDataPoints);
      const visibleData = chartData.slice(startIdx, endIdx);

      const relativeX1 = Math.max(0, x1 - margin.left);
      const relativeX2 = Math.max(0, x2 - margin.left);

      const index1 = Math.round((relativeX1 / chartWidth) * (visibleData.length - 1));
      const index2 = Math.round((relativeX2 / chartWidth) * (visibleData.length - 1));

      const selectionStart = startIdx + Math.min(index1, index2);
      const selectionEnd = startIdx + Math.max(index1, index2);

      if (selectionEnd > selectionStart) {
        const validStart = Math.max(0, Math.min(selectionStart, data.length - 1));
        const validEnd = Math.max(0, Math.min(selectionEnd, data.length - 1));

        console.log('Source selection:', {
          startIdx,
          endIdx,
          index1,
          index2,
          selectionStart: validStart,
          selectionEnd: validEnd,
          startTime: data[validStart]?.datetime,
          endTime: data[validEnd]?.datetime
        });

        onSourceSelection(validStart, validEnd, data);
      }
    }

    setIsDragging(false);
    setDragMode(null);
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
    if (isDragging) {
      setIsDragging(false);
      setDragMode(null);
    }
  };

  const zoomIn = () => setZoom(prev => Math.min(100, prev * 1.3));
  const zoomOut = () => setZoom(prev => Math.max(1, prev / 1.3));
  const resetZoom = () => { setZoom(1); setPan(0); };

  return (
    <div className="w-full space-y-4">
      {/* Controls */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-xl shadow-sm border border-orange-200">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={zoomIn}
              className="px-4 py-2 bg-white hover:bg-orange-100 border-2 border-orange-300 hover:border-orange-500 text-gray-800 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md"
            >
              🔍 +
            </button>
            <button
              onClick={zoomOut}
              className="px-4 py-2 bg-white hover:bg-orange-100 border-2 border-orange-300 hover:border-orange-500 text-gray-800 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md"
            >
              🔍 −
            </button>
            <button
              onClick={resetZoom}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md"
            >
              ↺ Reset zoom
            </button>
          </div>

          <div className="flex items-center gap-3 text-sm flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border-2 border-purple-300 hover:border-purple-500">
              <input
                type="checkbox"
                checked={wheelZoomEnabled}
                onChange={(e) => setWheelZoomEnabled(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-gray-700 font-medium">🖱️ Kolečko zoom</span>
            </label>

            <span className="text-orange-700 font-medium">Zoom: {zoom.toFixed(1)}×</span>
            {zoom > 1 && (
              <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium">
                Zobrazeno {Math.ceil(chartData.length / zoom)} z {chartData.length} bodů
              </span>
            )}
          </div>
        </div>

        <div className="mt-3 text-xs space-y-1">
          <div className="flex items-center gap-2 text-orange-700">
            <span className="font-semibold">💡 Ovládání:</span>
            <span>Táhni myší = pohyb po grafu | Kolečko myši = zoom</span>
          </div>
          <div className="flex items-center gap-2 text-purple-700">
            <span className="font-semibold">✨ Výběr měření:</span>
            <span>Drž <kbd className="px-1.5 py-0.5 bg-white rounded border border-purple-300 font-mono text-xs">Alt/Option</kbd> + táhni myší = označí interval měření</span>
          </div>
        </div>
      </div>

      {/* Výběr zobrazených frekvencí */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <span className="text-sm font-semibold text-gray-800">Zobrazit v grafu</span>
          <div className="flex items-center gap-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded border border-blue-300">
              <input type="checkbox" checked={showLaeq} onChange={(e) => setShowLaeq(e.target.checked)} className="w-4 h-4" />
              <span className="font-medium text-blue-700">LAeq</span>
            </label>
            <button
              onClick={() => setSelectedBands([])}
              disabled={selectedBands.length === 0}
              className="px-2 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-40"
            >
              Zrušit výběr pásem
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {STATIONARY_FREQUENCY_LIST.map((_, band) => {
            const on = selectedBands.includes(band);
            return (
              <button
                key={band}
                onClick={() => toggleBand(band)}
                className={`px-2 py-1 rounded text-xs font-medium border transition-colors ${
                  on ? 'text-white border-transparent' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
                style={on ? { backgroundColor: bandColor(band) } : undefined}
                aria-pressed={on}
              >
                {bandLabel(band)}
              </button>
            );
          })}
        </div>
        {!showLaeq && selectedBands.length === 0 && (
          <p className="mt-2 text-xs text-gray-500">Není vybráno nic – zobrazuje se LAeq.</p>
        )}
      </div>

      {/* Canvas Chart */}
      <div ref={containerRef} className="bg-white rounded-xl shadow-lg p-4 border-2 border-gray-200 overflow-hidden">
        <canvas
          ref={canvasRef}
          className={
            isDragging && dragMode === 'pan' ? 'cursor-grabbing' :
            isDragging && dragMode === 'select' ? 'cursor-crosshair' :
            altKeyPressed ? 'cursor-crosshair' :
            'cursor-grab'
          }
          style={{ touchAction: 'none' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        />
      </div>
    </div>
  );
}
