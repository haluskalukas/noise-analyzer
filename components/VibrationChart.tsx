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

    // Downsample to max 5000 points to prevent stack overflow
    const MAX_POINTS = 5000;
    let step = 1;
    let sampledData = data;

    if (data.length > MAX_POINTS) {
      step = Math.ceil(data.length / MAX_POINTS);
      sampledData = [];
      for (let i = 0; i < data.length; i += step) {
        sampledData.push(data[i]);
      }
    }

    return sampledData.map((point, index) => {
      // For Z axis: 50 Hz frequency (index 57)
      // Frequency 50 Hz is at position 17 in the list (0-indexed)
      // For Z axis (indices 40-59), 50 Hz is at index 40 + 17 = 57
      const freq50HzIndex = 57;
      const value = point.frequencies[freq50HzIndex];

      // Ensure datetime is a Date object
      const datetime = point.datetime instanceof Date ? point.datetime : new Date(point.datetime);

      if (index === 0) {
        console.log('First chartData point:', {
          datetime,
          dateType: typeof datetime,
          isDate: datetime instanceof Date,
          formatted: format(datetime, 'HH:mm:ss'),
          value,
          allFreqs: point.frequencies.length
        });
      }

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
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
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
      ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
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
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();

      // Draw tooltip
      const tooltipText = `${format(point.datetime, 'HH:mm:ss')}: ${point.value.toFixed(1)} dB`;
      ctx.font = '12px sans-serif';
      const textWidth = ctx.measureText(tooltipText).width;
      const tooltipX = Math.min(x, width - textWidth - 20);
      const tooltipY = y - 30;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(tooltipX - 5, tooltipY - 15, textWidth + 10, 25);

      ctx.fillStyle = '#ffffff';
      ctx.fillText(tooltipText, tooltipX, tooltipY);
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

      const rect = canvas.getBoundingClientRect();
      const x1 = dragStartPos.x - rect.left;
      const x2 = currentMousePos.x - rect.left;

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
        onTrainSelection(selectionStart, selectionEnd, data);
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

  return (
    <div className="space-y-4">
      {/* Info */}
      <div className="bg-gray-50 p-4 rounded-lg flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          Zobrazení: Osa Z, frekvence 50 Hz
        </span>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-600">
            Zoom: {zoom.toFixed(1)}x
          </span>
          <button
            onClick={() => { setZoom(1); setPan(0); }}
            className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded transition-colors"
          >
            Reset zoom
          </button>
        </div>
      </div>

      {/* Chart */}
      <div ref={containerRef} className="w-full">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          style={{
            cursor: altKeyPressed ? 'crosshair' : (isDragging && dragMode === 'pan') ? 'grabbing' : 'grab',
            touchAction: 'none',
          }}
          className="border border-gray-200 rounded"
        />
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>💡 Ovládání:</strong>
        </p>
        <ul className="text-xs text-blue-700 mt-2 space-y-1 ml-4 list-disc">
          <li>Tažení myší = posun grafu</li>
          <li>Kolečko myši = zoom</li>
          <li>Alt + tažení = výběr průjezdu vlaku</li>
        </ul>
      </div>
    </div>
  );
}
