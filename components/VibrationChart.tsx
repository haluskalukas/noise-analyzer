'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { VibrationDataPoint } from '@/types/vibration';
import { format } from 'date-fns';

interface VibrationChartProps {
  data: VibrationDataPoint[];
  onTrainSelection?: (startIdx: number, endIdx: number, points: VibrationDataPoint[]) => void;
}

export function VibrationChart({ data, onTrainSelection }: VibrationChartProps) {
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

  // Convert vibration data to chart format (extract 50 Hz from Z axis)
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Use all data - no downsampling
    return data.map((point, index) => {
      // For Z axis: 50 Hz frequency (index 57)
      // Frequency 50 Hz is at position 17 in the list (0-indexed)
      // For Z axis (indices 40-59), 50 Hz is at index 40 + 17 = 57
      const freq50HzIndex = 57;
      const value = point.frequencies[freq50HzIndex];

      // Ensure datetime is a Date object
      const datetime = point.datetime instanceof Date ? point.datetime : new Date(point.datetime);

      return {
        datetime,
        value: (!isNaN(value) && isFinite(value)) ? value : 0,
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

    // Calculate Y domain
    const visibleValues = visibleData.map(d => d.value);
    const yMin = Math.floor(Math.min(...visibleValues) - 5);
    const yMax = Math.ceil(Math.max(...visibleValues) + 5);

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

    // Draw data line
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
    }

    // Draw axis labels
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Čas', width / 2, height - 10);

    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Vibrace - osa Z, 50 Hz (dB)', 0, 0);
    ctx.restore();

    // Draw hover tooltip
    if (hoveredPoint !== null && hoveredPoint >= 0 && hoveredPoint < visibleData.length) {
      const point = visibleData[hoveredPoint];
      const x = xScale(hoveredPoint);
      const y = yScale(point.value);

      // Draw point
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();

      // Draw tooltip with highlighted time and value
      const timeText = format(point.datetime, 'HH:mm:ss');
      const valueText = `${point.value.toFixed(1)} dB`;
      ctx.font = 'bold 13px sans-serif';
      const timeWidth = ctx.measureText(timeText).width;
      const valueWidth = ctx.measureText(valueText).width;
      const totalWidth = timeWidth + valueWidth + 10; // 10px spacing between time and value

      const tooltipX = Math.min(x, width - totalWidth - 20);
      const tooltipY = y - 30;

      // Background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(tooltipX - 8, tooltipY - 18, totalWidth + 16, 28);

      // Time in yellow/green
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(timeText, tooltipX, tooltipY);

      // Value in white
      ctx.fillStyle = '#ffffff';
      ctx.fillText(valueText, tooltipX + timeWidth + 10, tooltipY);
    }

  }, [chartData, canvasSize, zoom, pan, isDragging, dragMode, dragStartPos, currentMousePos, hoveredPoint]);

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
    if (isDragging && dragMode === 'select' && onTrainSelection) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // dragStartPos and currentMousePos already have rect.left subtracted from handleMouseDown
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

      // Calculate indices in the original data array
      // Since chartData now equals data (no downsampling), indices should match
      const selectionStart = startIdx + Math.min(index1, index2);
      const selectionEnd = startIdx + Math.max(index1, index2);

      if (selectionEnd > selectionStart) {
        // Ensure indices are within bounds
        const validStart = Math.max(0, Math.min(selectionStart, data.length - 1));
        const validEnd = Math.max(0, Math.min(selectionEnd, data.length - 1));

        console.log('Train selection:', {
          startIdx,
          endIdx,
          index1,
          index2,
          selectionStart: validStart,
          selectionEnd: validEnd,
          startTime: data[validStart]?.datetime,
          endTime: data[validEnd]?.datetime
        });

        onTrainSelection(validStart, validEnd, data);
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
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl shadow-sm border border-blue-200">
        <div className="flex items-center justify-between flex-wrap gap-3">
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

            <span className="text-blue-700 font-medium">Zoom: {zoom.toFixed(1)}×</span>
            {zoom > 1 && (
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                Zobrazeno {Math.ceil(chartData.length / zoom)} z {chartData.length} bodů
              </span>
            )}
          </div>
        </div>

        <div className="mt-3 text-xs space-y-1">
          <div className="flex items-center gap-2 text-blue-700">
            <span className="font-semibold">💡 Ovládání:</span>
            <span>Táhni myší = pohyb po grafu | Kolečko myši = zoom</span>
          </div>
          <div className="flex items-center gap-2 text-purple-700">
            <span className="font-semibold">✨ Výběr vlaku:</span>
            <span>Drž <kbd className="px-1.5 py-0.5 bg-white rounded border border-purple-300 font-mono text-xs">Alt/Option</kbd> + táhni myší = označí průjezd vlaku</span>
          </div>
        </div>
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
