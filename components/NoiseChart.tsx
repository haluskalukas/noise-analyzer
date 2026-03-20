'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { NoiseDataPoint, TimeFilter } from '@/types';

interface NoiseChartProps {
  data: NoiseDataPoint[];
  filter: TimeFilter;
  showAverage?: boolean;
  deletedIndices: Set<number>;
  onDeletedIndicesChange: (indices: Set<number>) => void;
}

export function NoiseChart({ data, filter, showAverage = true, deletedIndices, onDeletedIndicesChange }: NoiseChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'pan' | 'select' | 'delete' | null>(null);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [currentMousePos, setCurrentMousePos] = useState({ x: 0, y: 0 });
  const [panStartValue, setPanStartValue] = useState(0);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 500 });
  const [wheelZoomEnabled, setWheelZoomEnabled] = useState(true);
  const [deleteMode, setDeleteMode] = useState(false);

  const filteredData = useMemo(() => {
    // First, filter out deleted points from original data
    let filtered = data.filter((_, index) => !deletedIndices.has(index));

    // Then apply time filters
    if (filter.type === 'day') {
      filtered = filtered.filter(p => p.hour >= 6 && p.hour < 22);
    } else if (filter.type === 'night') {
      filtered = filtered.filter(p => p.hour < 6 || p.hour >= 22);
    } else if (filter.type === 'custom' && filter.startHour !== undefined && filter.endHour !== undefined) {
      filtered = filtered.filter(p => {
        if (filter.startHour! < filter.endHour!) {
          return p.hour >= filter.startHour! && p.hour < filter.endHour!;
        } else {
          return p.hour >= filter.startHour! || p.hour < filter.endHour!;
        }
      });
    }

    return filtered;
  }, [data, filter, deletedIndices]);

  const average = useMemo(() => {
    if (filteredData.length === 0) return 0;
    const sumOfPowers = filteredData.reduce((sum, p) => sum + Math.pow(10, p.value / 10), 0);
    const avgPower = sumOfPowers / filteredData.length;
    return 10 * Math.log10(avgPower);
  }, [filteredData]);

  const stats = useMemo(() => {
    if (filteredData.length === 0) return { min: 0, max: 100 };
    const values = filteredData.map(p => p.value);
    return {
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }, [filteredData]);

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
        setZoom(prev => Math.max(1, Math.min(20, prev * delta)));
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
    if (!canvas || filteredData.length === 0) return;

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
    // zoom = totalPoints / visiblePoints, so visiblePoints = totalPoints / zoom
    const visibleDataPoints = Math.ceil(filteredData.length / zoom);
    const maxPan = Math.max(0, filteredData.length - visibleDataPoints);
    const currentPan = Math.max(0, Math.min(pan, maxPan));

    const startIdx = Math.floor(currentPan);
    const endIdx = Math.min(filteredData.length, startIdx + visibleDataPoints);
    const visibleData = filteredData.slice(startIdx, endIdx);

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

    // Smart X axis - show nice round time intervals
    const getTimeInterval = () => {
      if (visibleData.length === 0) return { minutes: 60, format: 'HH:00' };

      const timeSpanMinutes = (visibleData[visibleData.length - 1].datetime.getTime() - visibleData[0].datetime.getTime()) / 60000;

      // Choose interval based on time span
      if (timeSpanMinutes <= 10) return { minutes: 1, format: 'HH:mm' }; // 1 min
      if (timeSpanMinutes <= 30) return { minutes: 5, format: 'HH:mm' }; // 5 min
      if (timeSpanMinutes <= 90) return { minutes: 10, format: 'HH:mm' }; // 10 min
      if (timeSpanMinutes <= 180) return { minutes: 15, format: 'HH:mm' }; // 15 min
      if (timeSpanMinutes <= 360) return { minutes: 30, format: 'HH:mm' }; // 30 min
      if (timeSpanMinutes <= 720) return { minutes: 60, format: 'HH:00' }; // 1 hour
      if (timeSpanMinutes <= 1440) return { minutes: 120, format: 'HH:00' }; // 2 hours
      if (timeSpanMinutes <= 2880) return { minutes: 180, format: 'HH:00' }; // 3 hours
      return { minutes: 360, format: 'HH:00' }; // 6 hours
    };

    const { minutes: intervalMinutes, format: timeFormat } = getTimeInterval();

    // Find nice round time points
    const timePoints: { datetime: Date, index: number }[] = [];
    visibleData.forEach((point, index) => {
      const mins = point.datetime.getMinutes();
      const hours = point.datetime.getHours();

      // Check if this is a round time point
      if (intervalMinutes >= 60) {
        // For hourly intervals, check if it's on the hour and matches interval
        if (mins === 0 && hours % (intervalMinutes / 60) === 0) {
          timePoints.push({ datetime: point.datetime, index });
        }
      } else {
        // For minute intervals, check if minutes match
        if (mins % intervalMinutes === 0) {
          timePoints.push({ datetime: point.datetime, index });
        }
      }
    });

    // Draw vertical grid lines at time points
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;

    // Calculate minimum pixel distance between labels to avoid overlap
    // Rotated text needs ~50-60px spacing
    const minLabelSpacing = 60;
    let lastLabelX = -1000; // Start far left so first label always shows

    timePoints.forEach(({ datetime, index }, i) => {
      const x = xScale(index);

      // Always draw grid line
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, height - margin.bottom);
      ctx.stroke();

      // Only draw label if there's enough space since last label
      const spaceSinceLastLabel = x - lastLabelX;
      const isLastPoint = i === timePoints.length - 1;

      if (spaceSinceLastLabel >= minLabelSpacing || isLastPoint) {
        const hours = datetime.getHours().toString().padStart(2, '0');
        const mins = datetime.getMinutes().toString().padStart(2, '0');
        const label = timeFormat === 'HH:00' ? `${hours}:00` : `${hours}:${mins}`;

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
    ctx.fillText('Hluk (dB)', 0, 0);
    ctx.restore();

    // Average line removed per user request

    // Draw data line
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    ctx.beginPath();
    visibleData.forEach((point, i) => {
      const x = xScale(i);
      const y = yScale(point.value);

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
        const y = yScale(point.value);

        ctx.fillStyle = i === hoveredPoint ? '#2563eb' : '#3b82f6';
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

    // Draw hover tooltip
    if (hoveredPoint !== null && hoveredPoint < visibleData.length) {
      const point = visibleData[hoveredPoint];
      const x = xScale(hoveredPoint);
      const y = yScale(point.value);

      const tooltipText = `${point.value.toFixed(1)} dB`;
      const time = `${point.datetime.getHours().toString().padStart(2, '0')}:${point.datetime.getMinutes().toString().padStart(2, '0')}`;

      ctx.font = '12px sans-serif';
      const textWidth = Math.max(ctx.measureText(tooltipText).width, ctx.measureText(time).width);

      const tooltipX = x + 15;
      const tooltipY = y - 35;
      const tooltipPadding = 8;

      // Tooltip background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(tooltipX, tooltipY, textWidth + tooltipPadding * 2, 40, 6);
      ctx.fill();
      ctx.stroke();

      // Tooltip text
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(tooltipText, tooltipX + tooltipPadding, tooltipY + 18);
      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#6b7280';
      ctx.fillText(time, tooltipX + tooltipPadding, tooltipY + 33);
    }

    // Draw selection box if selecting or deleting
    if (isDragging && (dragMode === 'select' || dragMode === 'delete')) {
      const x1 = Math.min(dragStartPos.x, currentMousePos.x);
      const x2 = Math.max(dragStartPos.x, currentMousePos.x);
      const selectionWidth = x2 - x1;

      if (selectionWidth > 5) {
        if (dragMode === 'delete') {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
          ctx.strokeStyle = '#ef4444';
        } else {
          ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
          ctx.strokeStyle = '#3b82f6';
        }
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.fillRect(x1, margin.top, selectionWidth, chartHeight);
        ctx.strokeRect(x1, margin.top, selectionWidth, chartHeight);
        ctx.setLineDash([]);
      }
    }

  }, [filteredData, zoom, pan, average, showAverage, canvasSize, hoveredPoint, stats, isDragging, dragMode, dragStartPos, currentMousePos]);

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;

    setIsDragging(true);
    setDragStartPos({ x, y: e.clientY - rect.top });
    setCurrentMousePos({ x, y: e.clientY - rect.top });
    setPanStartValue(pan);
    setDragMode(null); // Will be determined during movement
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const margin = 60;
    const chartWidth = rect.width - margin - 40;

    setCurrentMousePos({ x, y });

    if (isDragging) {
      const dx = x - dragStartPos.x;
      const distance = Math.abs(dx);

      // Determine drag mode based on distance
      if (dragMode === null) {
        if (distance > 5) {
          // After 5px, decide mode based on keys and delete mode
          if (deleteMode) {
            setDragMode('delete');
          } else if (e.altKey) {
            setDragMode('select');
          } else {
            setDragMode('pan');
          }
        }
      }

      if (dragMode === 'pan') {
        // Pan mode - move the graph
        const visibleDataPoints = Math.ceil(filteredData.length / zoom);
        const dataPerPixel = visibleDataPoints / chartWidth;
        const panDelta = -dx * dataPerPixel;

        const maxPan = Math.max(0, filteredData.length - visibleDataPoints);

        const newPan = panStartValue + panDelta;
        setPan(Math.max(0, Math.min(maxPan, newPan)));
      }
      // Selection mode - just track position, will zoom on mouseUp
    } else {
      // Update hovered point when not dragging
      if (x >= margin && x <= rect.width - 40) {
        const visibleDataPoints = Math.ceil(filteredData.length / zoom);
        const startIdx = Math.floor(pan);
        const relativeX = (x - margin) / chartWidth;
        const pointIndex = Math.floor(relativeX * visibleDataPoints);

        if (pointIndex >= 0 && pointIndex < visibleDataPoints && startIdx + pointIndex < filteredData.length) {
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
    if (!canvasRef.current) return;

    // If this was delete mode, mark data for deletion
    if (dragMode === 'delete' && isDragging) {
      const rect = canvasRef.current.getBoundingClientRect();
      const margin = 60;
      const chartWidth = rect.width - margin - 40;

      const selX1 = Math.min(dragStartPos.x, currentMousePos.x);
      const selX2 = Math.max(dragStartPos.x, currentMousePos.x);

      if (selX2 - selX1 > 10) {
        const chartX1 = Math.max(0, selX1 - margin);
        const chartX2 = Math.min(chartWidth, selX2 - margin);

        const startRatio = chartX1 / chartWidth;
        const endRatio = chartX2 / chartWidth;

        const visibleDataPoints = Math.ceil(filteredData.length / zoom);
        const currentStartIdx = Math.floor(pan);
        const currentEndIdx = Math.min(filteredData.length, currentStartIdx + visibleDataPoints);
        const actualVisiblePoints = currentEndIdx - currentStartIdx;

        const selectedStartIdx = currentStartIdx + Math.floor(startRatio * actualVisiblePoints);
        const selectedEndIdx = currentStartIdx + Math.ceil(endRatio * actualVisiblePoints);

        // Find original indices in data array and mark for deletion
        const newDeletedIndices = new Set(deletedIndices);
        for (let i = selectedStartIdx; i < selectedEndIdx; i++) {
          if (i >= 0 && i < filteredData.length) {
            // Find this point in original data array
            const point = filteredData[i];
            const originalIndex = data.indexOf(point);
            if (originalIndex !== -1) {
              newDeletedIndices.add(originalIndex);
            }
          }
        }
        onDeletedIndicesChange(newDeletedIndices);
      }
    }

    // If this was a selection, zoom to selected area
    if (dragMode === 'select' && isDragging) {
      const rect = canvasRef.current.getBoundingClientRect();
      const margin = 60;
      const chartWidth = rect.width - margin - 40;

      // Get selection bounds in canvas coordinates
      const selX1 = Math.min(dragStartPos.x, currentMousePos.x);
      const selX2 = Math.max(dragStartPos.x, currentMousePos.x);
      const selectionWidth = selX2 - selX1;

      if (selectionWidth > 20) { // Minimum selection width
        // Convert canvas x to chart x (subtract margin)
        const chartX1 = Math.max(0, selX1 - margin);
        const chartX2 = Math.min(chartWidth, selX2 - margin);

        // Calculate what portion of the VISIBLE data was selected
        const startRatio = chartX1 / chartWidth;
        const endRatio = chartX2 / chartWidth;

        // Calculate visible data range
        const visibleDataPoints = Math.ceil(filteredData.length / zoom);
        const currentStartIdx = Math.floor(pan);
        const currentEndIdx = Math.min(filteredData.length, currentStartIdx + visibleDataPoints);
        const actualVisiblePoints = currentEndIdx - currentStartIdx;

        // Map selection to actual data indices
        const selectedStartIdx = currentStartIdx + Math.floor(startRatio * actualVisiblePoints);
        const selectedEndIdx = currentStartIdx + Math.ceil(endRatio * actualVisiblePoints);
        const selectedRange = selectedEndIdx - selectedStartIdx;

        console.log('Selection:', {
          selectionWidth,
          chartX1, chartX2,
          startRatio, endRatio,
          currentStartIdx, currentEndIdx,
          selectedStartIdx, selectedEndIdx,
          selectedRange
        });

        if (selectedRange > 3) {
          // Calculate new zoom based on how many points should be visible
          // We want selectedRange points to fill the whole width
          // zoom = totalPoints / visiblePoints
          const newZoom = filteredData.length / selectedRange;
          const clampedZoom = Math.min(20, Math.max(1, newZoom));

          console.log('Zoom calculation:', {
            totalPoints: filteredData.length,
            selectedRange,
            newZoom,
            clampedZoom,
            newPan: selectedStartIdx
          });

          setZoom(clampedZoom);
          setPan(selectedStartIdx);
        }
      }
    }

    setIsDragging(false);
    setDragMode(null);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setDragMode(null);
    setHoveredPoint(null);
  };


  const zoomIn = () => setZoom(prev => Math.min(20, prev * 1.3));
  const zoomOut = () => setZoom(prev => Math.max(1, prev / 1.3));
  const resetZoom = () => { setZoom(1); setPan(0); };
  const resetDeletedData = () => onDeletedIndicesChange(new Set());

  if (filteredData.length === 0) {
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

            <label className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border-2 transition-all ${
              deleteMode
                ? 'bg-red-100 border-red-500 text-red-700'
                : 'bg-white border-red-300 hover:border-red-400 text-gray-700'
            }`}>
              <input
                type="checkbox"
                checked={deleteMode}
                onChange={(e) => setDeleteMode(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="font-medium">🗑️ Mazání dat</span>
            </label>

            {deletedIndices.size > 0 && (
              <button
                onClick={resetDeletedData}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md"
              >
                ↺ Obnovit data ({deletedIndices.size} smazáno)
              </button>
            )}

            <span className="text-blue-700 font-medium">Zoom: {zoom.toFixed(1)}×</span>
            {zoom > 1 && (
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                Zobrazeno {Math.ceil(filteredData.length / zoom)} z {filteredData.length} bodů
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
            <span className="font-semibold">✨ Výběr oblasti:</span>
            <span>Drž <kbd className="px-1.5 py-0.5 bg-white rounded border border-purple-300 font-mono text-xs">Alt/Option</kbd> + táhni myší = přiblíží vybranou oblast</span>
          </div>
          {deleteMode && (
            <div className="flex items-center gap-2 text-red-700">
              <span className="font-semibold">🗑️ Režim mazání:</span>
              <span>Táhni myší přes data, která chceš odstranit (červený výběr) - statistiky se automaticky přepočítají</span>
            </div>
          )}
        </div>
      </div>

      {/* Canvas Chart */}
      <div ref={containerRef} className="bg-white rounded-xl shadow-lg p-4 border-2 border-gray-200 overflow-hidden">
        <canvas
          ref={canvasRef}
          className={
            isDragging && dragMode === 'pan' ? 'cursor-grabbing' :
            isDragging && dragMode === 'select' ? 'cursor-crosshair' :
            isDragging && dragMode === 'delete' ? 'cursor-not-allowed' :
            deleteMode ? 'cursor-not-allowed' :
            'cursor-grab'
          }
          style={{ touchAction: 'none' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200">
          <p className="text-xs text-blue-700 font-medium">Počet bodů</p>
          <p className="text-3xl font-bold text-blue-600">{filteredData.length}</p>
        </div>
        <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl shadow-sm border border-amber-200">
          <p className="text-xs text-amber-700 font-medium">Průměr (Leq)</p>
          <p className="text-3xl font-bold text-amber-600">{average.toFixed(1)} dB</p>
        </div>
        <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-sm border border-gray-200">
          <p className="text-xs text-gray-700 font-medium">Rozsah</p>
          <p className="text-3xl font-bold text-gray-700">
            {stats.min.toFixed(0)} - {stats.max.toFixed(0)} dB
          </p>
        </div>
      </div>
    </div>
  );
}
