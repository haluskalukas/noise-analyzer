'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import { ImpulseData } from '@/app/impulzni-hluk/page';
import { formatNumber } from '@/lib/format';

interface ImpulseInteractiveChartProps {
  data: ImpulseData[];
}

export default function ImpulseInteractiveChart({ data }: ImpulseInteractiveChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [panStartValue, setPanStartValue] = useState(0);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 500 });
  const [wheelZoomEnabled, setWheelZoomEnabled] = useState(true);

  // Toggle visibility of each metric
  const [showLAeq, setShowLAeq] = useState(true);
  const [showLAImax, setShowLAImax] = useState(true);
  const [showLASmax, setShowLASmax] = useState(true);

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

  // Calculate visible data range
  const visibleData = useMemo(() => {
    if (data.length === 0) return [];

    const visibleDataPoints = Math.ceil(data.length / zoom);
    const maxPan = Math.max(0, data.length - visibleDataPoints);
    const currentPan = Math.max(0, Math.min(pan, maxPan));

    const startIdx = Math.floor(currentPan);
    const endIdx = Math.min(data.length, startIdx + visibleDataPoints);

    return data.slice(startIdx, endIdx);
  }, [data, zoom, pan]);

  // Draw chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

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

    if (visibleData.length === 0) return;

    // Calculate Y domain
    const allValues: number[] = [];
    if (showLAeq) allValues.push(...visibleData.map(d => d.lAeq));
    if (showLAImax) allValues.push(...visibleData.map(d => d.lAImax));
    if (showLASmax) allValues.push(...visibleData.map(d => d.lASmax));

    if (allValues.length === 0) return;

    const yMin = Math.floor(Math.min(...allValues) - 5);
    const yMax = Math.ceil(Math.max(...allValues) + 5);

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
    const ySteps = 8;
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

    // X axis - time points
    const getTimeInterval = () => {
      if (visibleData.length === 0) return { minutes: 60 };

      const timeSpanMinutes = (visibleData[visibleData.length - 1].timestamp.getTime() - visibleData[0].timestamp.getTime()) / 60000;

      if (timeSpanMinutes <= 10) return { minutes: 1 };
      if (timeSpanMinutes <= 30) return { minutes: 5 };
      if (timeSpanMinutes <= 90) return { minutes: 10 };
      if (timeSpanMinutes <= 180) return { minutes: 15 };
      if (timeSpanMinutes <= 360) return { minutes: 30 };
      if (timeSpanMinutes <= 720) return { minutes: 60 };
      if (timeSpanMinutes <= 1440) return { minutes: 120 };
      if (timeSpanMinutes <= 2880) return { minutes: 180 };
      return { minutes: 360 };
    };

    const { minutes: intervalMinutes } = getTimeInterval();

    // Find nice round time points
    const timePoints: { timestamp: Date, index: number }[] = [];
    visibleData.forEach((point, index) => {
      const mins = point.timestamp.getMinutes();
      const hours = point.timestamp.getHours();

      if (intervalMinutes >= 60) {
        if (mins === 0 && hours % (intervalMinutes / 60) === 0) {
          timePoints.push({ timestamp: point.timestamp, index });
        }
      } else {
        if (mins % intervalMinutes === 0) {
          timePoints.push({ timestamp: point.timestamp, index });
        }
      }
    });

    // Draw vertical grid lines
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;

    const minLabelSpacing = 60;
    let lastLabelX = -1000;

    timePoints.forEach(({ timestamp, index }, i) => {
      const x = xScale(index);

      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, height - margin.bottom);
      ctx.stroke();

      const spaceSinceLastLabel = x - lastLabelX;
      const isLastPoint = i === timePoints.length - 1;

      if (spaceSinceLastLabel >= minLabelSpacing || isLastPoint) {
        const hours = timestamp.getHours().toString().padStart(2, '0');
        const mins = timestamp.getMinutes().toString().padStart(2, '0');
        const label = `${hours}:${mins}`;

        ctx.save();
        ctx.fillStyle = '#4b5563';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'right';
        ctx.translate(x, height - margin.bottom + 10);
        ctx.rotate(-Math.PI / 4);
        ctx.fillText(label, 0, 0);
        ctx.restore();

        lastLabelX = x;
      }
    });

    // Draw axes
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, height - margin.bottom);
    ctx.lineTo(width - margin.right, height - margin.bottom);
    ctx.stroke();

    // Y axis label
    ctx.save();
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.translate(20, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Hladina hluku [dB(A)]', 0, 0);
    ctx.restore();

    // Draw data lines
    const drawLine = (getValue: (d: ImpulseData) => number, color: string, lineWidth: number) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      ctx.beginPath();
      visibleData.forEach((point, i) => {
        const x = xScale(i);
        const y = yScale(getValue(point));

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      // Draw points if zoomed in
      if (visibleData.length < 100) {
        visibleData.forEach((point, i) => {
          const x = xScale(i);
          const y = yScale(getValue(point));

          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(x, y, i === hoveredPoint ? 5 : 3, 0, Math.PI * 2);
          ctx.fill();

          if (i === hoveredPoint) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        });
      }
    };

    // Draw lines in order: LAeq, LASmax, LAImax (so LAImax is on top)
    if (showLAeq) drawLine(d => d.lAeq, '#10b981', 2.5);
    if (showLASmax) drawLine(d => d.lASmax, '#f59e0b', 2.5);
    if (showLAImax) drawLine(d => d.lAImax, '#ef4444', 2.5);

    // Draw hover tooltip
    if (hoveredPoint !== null && hoveredPoint < visibleData.length) {
      const point = visibleData[hoveredPoint];
      const x = xScale(hoveredPoint);
      const y = yScale(point.lAImax); // Use highest value for tooltip position

      const lines: string[] = [];
      if (showLAImax) lines.push(`LAImax: ${formatNumber(point.lAImax)} dB(A)`);
      if (showLASmax) lines.push(`LASmax: ${formatNumber(point.lASmax)} dB(A)`);
      if (showLAeq) lines.push(`LAeq: ${formatNumber(point.lAeq)} dB(A)`);
      const time = `${point.timestamp.getHours().toString().padStart(2, '0')}:${point.timestamp.getMinutes().toString().padStart(2, '0')}:${point.timestamp.getSeconds().toString().padStart(2, '0')}`;
      const dayNight = point.isDaytime ? '☀️ Den' : '🌙 Noc';

      ctx.font = '12px sans-serif';
      const maxTextWidth = Math.max(...lines.map(l => ctx.measureText(l).width), ctx.measureText(time).width, ctx.measureText(dayNight).width);

      const tooltipX = x + 15;
      const tooltipY = y - 20;
      const tooltipPadding = 8;
      const lineHeight = 16;
      const tooltipHeight = tooltipPadding * 2 + (lines.length + 2) * lineHeight;

      // Tooltip background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(tooltipX, tooltipY, maxTextWidth + tooltipPadding * 2, tooltipHeight, 6);
      ctx.fill();
      ctx.stroke();

      // Tooltip text
      ctx.textAlign = 'left';
      let textY = tooltipY + tooltipPadding + 12;

      lines.forEach((line, i) => {
        if (line.includes('LAImax')) ctx.fillStyle = '#ef4444';
        else if (line.includes('LASmax')) ctx.fillStyle = '#f59e0b';
        else if (line.includes('LAeq')) ctx.fillStyle = '#10b981';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(line, tooltipX + tooltipPadding, textY);
        textY += lineHeight;
      });

      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#6b7280';
      ctx.fillText(time, tooltipX + tooltipPadding, textY);
      textY += lineHeight;
      ctx.fillText(dayNight, tooltipX + tooltipPadding, textY);
    }

  }, [data, visibleData, zoom, pan, canvasSize, hoveredPoint, showLAeq, showLAImax, showLASmax]);

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;

    setIsDragging(true);
    setDragStartPos({ x, y: e.clientY - rect.top });
    setPanStartValue(pan);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const margin = 60;
    const chartWidth = rect.width - margin - 40;

    if (isDragging) {
      const dx = x - dragStartPos.x;
      const visibleDataPoints = Math.ceil(data.length / zoom);
      const dataPerPixel = visibleDataPoints / chartWidth;
      const panDelta = -dx * dataPerPixel;

      const maxPan = Math.max(0, data.length - visibleDataPoints);
      const newPan = panStartValue + panDelta;
      setPan(Math.max(0, Math.min(maxPan, newPan)));
    } else {
      // Update hovered point
      if (x >= margin && x <= rect.width - 40) {
        const relativeX = (x - margin) / chartWidth;
        const pointIndex = Math.floor(relativeX * visibleData.length);

        if (pointIndex >= 0 && pointIndex < visibleData.length) {
          setHoveredPoint(pointIndex);
        } else {
          setHoveredPoint(null);
        }
      } else {
        setHoveredPoint(null);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setHoveredPoint(null);
  };

  const zoomIn = () => setZoom(prev => Math.min(100, prev * 1.3));
  const zoomOut = () => setZoom(prev => Math.max(1, prev / 1.3));
  const resetZoom = () => { setZoom(1); setPan(0); };

  if (data.length === 0) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-500">Žádná data k zobrazení</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Controls */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl shadow-sm border border-blue-200">
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Zoom controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={zoomIn}
              className="px-4 py-2 bg-white hover:bg-blue-100 border-2 border-blue-300 hover:border-blue-500 text-gray-800 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md"
            >
              🔍 +
            </button>
            <button
              onClick={zoomOut}
              className="px-4 py-2 bg-white hover:bg-blue-100 border-2 border-blue-300 hover:border-blue-500 text-gray-800 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md"
            >
              🔍 −
            </button>
            <button
              onClick={resetZoom}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md"
            >
              ↺ Reset zoom
            </button>
          </div>

          {/* Metric toggles */}
          <div className="flex items-center gap-3 flex-wrap">
            <label className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border-2 transition-all ${
              showLAeq ? 'bg-green-100 border-green-500 text-green-700' : 'bg-white border-gray-300 text-gray-500'
            }`}>
              <input
                type="checkbox"
                checked={showLAeq}
                onChange={(e) => setShowLAeq(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="font-medium">LAeq</span>
            </label>

            <label className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border-2 transition-all ${
              showLAImax ? 'bg-red-100 border-red-500 text-red-700' : 'bg-white border-gray-300 text-gray-500'
            }`}>
              <input
                type="checkbox"
                checked={showLAImax}
                onChange={(e) => setShowLAImax(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="font-medium">LAImax</span>
            </label>

            <label className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border-2 transition-all ${
              showLASmax ? 'bg-orange-100 border-orange-500 text-orange-700' : 'bg-white border-gray-300 text-gray-500'
            }`}>
              <input
                type="checkbox"
                checked={showLASmax}
                onChange={(e) => setShowLASmax(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="font-medium">LASmax</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border-2 border-purple-300 hover:border-purple-500">
              <input
                type="checkbox"
                checked={wheelZoomEnabled}
                onChange={(e) => setWheelZoomEnabled(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-gray-700 font-medium">🖱️ Kolečko zoom</span>
            </label>

            <span className="text-blue-700 font-medium">Zoom: {formatNumber(zoom)}×</span>
            {zoom > 1 && (
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium text-sm">
                Zobrazeno {Math.ceil(data.length / zoom)} z {data.length} impulsů
              </span>
            )}
          </div>
        </div>

        <div className="mt-3 text-xs space-y-1">
          <div className="flex items-center gap-2 text-blue-700">
            <span className="font-semibold">💡 Ovládání:</span>
            <span>Táhni myší = pohyb po grafu | Kolečko myši = zoom</span>
          </div>
        </div>
      </div>

      {/* Canvas Chart */}
      <div ref={containerRef} className="bg-white rounded-xl shadow-lg p-4 border-2 border-gray-200 overflow-hidden">
        <canvas
          ref={canvasRef}
          className={isDragging ? 'cursor-grabbing' : 'cursor-grab'}
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
