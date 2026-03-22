'use client';

import { useRef } from 'react';
import { StationarySource, STATIONARY_FREQUENCY_LIST } from '@/types/stationary';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import * as XLSX from 'xlsx';
import { formatNumber } from '@/lib/format';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface StationarySourceDetailProps {
  source: StationarySource;
  allSources: StationarySource[];
  onClose: () => void;
}

export function StationarySourceDetail({ source, allSources, onClose }: StationarySourceDetailProps) {
  const chartRef = useRef<ChartJS<'bar'>>(null);

  // Find background (there's only one)
  const isSource = source.type === 'source';
  const background = allSources.find(s => s.type === 'background');

  // Prepare chart data
  const datasets = [];

  if (isSource) {
    // If this is source, show source (orange) + background (green)
    datasets.push({
      label: source.name || 'Zdroj hluku',
      data: source.avgFrequencies,
      backgroundColor: 'rgba(249, 115, 22, 0.8)',
      borderColor: 'rgba(234, 88, 12, 1)',
      borderWidth: 2,
    });
    if (background) {
      datasets.push({
        label: background.name || 'Hluk pozadí',
        data: background.avgFrequencies,
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(22, 163, 74, 1)',
        borderWidth: 2,
      });
    }
  } else {
    // If this is background, show ONLY background (green)
    datasets.push({
      label: source.name || 'Hluk pozadí',
      data: source.avgFrequencies,
      backgroundColor: 'rgba(34, 197, 94, 0.8)',
      borderColor: 'rgba(22, 163, 74, 1)',
      borderWidth: 2,
    });
  }

  const chartData = {
    labels: STATIONARY_FREQUENCY_LIST.map(f => f.toString()),
    datasets,
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        left: 10,
        right: 30,
        top: 10,
        bottom: 10,
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Frekvenční spektrum - 1/3 oktávová pásma',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(1).replace('.', ',') + ' dB';
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Frekvence [Hz]',
          font: {
            size: 12,
            weight: 'bold' as const,
          }
        },
      },
      y: {
        title: {
          display: true,
          text: '[dB]',
          font: {
            size: 12,
            weight: 'bold' as const,
          }
        },
        beginAtZero: true,
      },
    },
  };

  const startTime = `${source.startTime.getHours().toString().padStart(2, '0')}:${source.startTime.getMinutes().toString().padStart(2, '0')}:${source.startTime.getSeconds().toString().padStart(2, '0')}`;
  const endTime = `${source.endTime.getHours().toString().padStart(2, '0')}:${source.endTime.getMinutes().toString().padStart(2, '0')}:${source.endTime.getSeconds().toString().padStart(2, '0')}`;

  const handleExportToExcel = async () => {
    const wb = XLSX.utils.book_new();

    // Prepare table data - include both source and background if available
    const tableData = [
      ['Frekvenční spektrum - 1/3 oktávová pásma'],
      [''],
      ['Frekvence [Hz]', ...STATIONARY_FREQUENCY_LIST.map(f => f.toString())],
    ];

    if (isSource) {
      tableData.push([source.name || 'Zdroj hluku', ...source.avgFrequencies.map(v => formatNumber(v))]);
      if (background) {
        tableData.push([background.name || 'Hluk pozadí', ...background.avgFrequencies.map(v => formatNumber(v))]);
      }
    } else {
      // Background only - show only background
      tableData.push([source.name || 'Hluk pozadí', ...source.avgFrequencies.map(v => formatNumber(v))]);
    }

    // Add summary statistics
    tableData.push(['']);
    tableData.push(['Statistiky', source.name || (isSource ? 'Zdroj hluku' : 'Hluk pozadí'), background?.name || '']);
    tableData.push(['LAeq (dB)', formatNumber(source.laeq), background ? formatNumber(background.laeq) : '']);
    tableData.push(['L5 (dB)', formatNumber(source.l5), background ? formatNumber(background.l5) : '']);
    tableData.push(['L10 (dB)', formatNumber(source.l10), background ? formatNumber(background.l10) : '']);
    tableData.push(['L50 (dB)', formatNumber(source.l50), background ? formatNumber(background.l50) : '']);
    tableData.push(['L90 (dB)', formatNumber(source.l90), background ? formatNumber(background.l90) : '']);
    tableData.push(['L95 (dB)', formatNumber(source.l95), background ? formatNumber(background.l95) : '']);
    tableData.push(['Min (dB)', formatNumber(source.min), background ? formatNumber(background.min) : '']);
    tableData.push(['Max (dB)', formatNumber(source.max), background ? formatNumber(background.max) : '']);

    const ws = XLSX.utils.aoa_to_sheet(tableData);

    XLSX.utils.book_append_sheet(wb, ws, 'Detail měření');

    const filename = `stacionarni_detail_${startTime.replace(/:/g, '-')}_${source.name || 'mereni'}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  const handleExportChartToPNG = () => {
    if (chartRef.current) {
      const chartCanvas = chartRef.current.canvas;
      if (chartCanvas) {
        chartCanvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `stacionarni_graf_${startTime.replace(/:/g, '-')}_${source.name || 'mereni'}.png`;
            link.click();
            URL.revokeObjectURL(url);
          }
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-red-600 text-white p-6 rounded-t-xl flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Detail měření</h2>
            <p className="text-orange-100 mt-1">
              {startTime} - {endTime} | {source.name || (isSource ? 'Zdroj hluku' : 'Hluk pozadí')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportChartToPNG}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-all flex items-center gap-2"
            >
              🖼️ Stáhnout graf PNG
            </button>
            <button
              onClick={handleExportToExcel}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all flex items-center gap-2"
            >
              📥 Export do Excel
            </button>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Chart */}
          <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
            <div style={{ height: '400px' }}>
              <Bar ref={chartRef} data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* Statistics Table */}
          <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 p-4 border-b">
              <h3 className="font-bold text-gray-900">
                Statistiky měření
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-r">
                      Parametr
                    </th>
                    <th className={`px-4 py-3 text-center text-xs font-bold text-gray-700 border-r ${isSource ? 'bg-orange-50' : 'bg-green-50'}`}>
                      {source.name || (isSource ? 'Zdroj hluku' : 'Hluk pozadí')}
                    </th>
                    {isSource && background && (
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 bg-green-50">
                        {background.name || 'Hluk pozadí'}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-bold text-gray-900 bg-gray-50 border-r">LAeq (dB)</td>
                    <td className="px-4 py-3 text-center font-bold border-r">{formatNumber(source.laeq)}</td>
                    {isSource && background && <td className="px-4 py-3 text-center font-bold">{formatNumber(background.laeq)}</td>}
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-bold text-gray-900 bg-gray-50 border-r">L5 (dB)</td>
                    <td className="px-4 py-3 text-center border-r">{formatNumber(source.l5)}</td>
                    {isSource && background && <td className="px-4 py-3 text-center">{formatNumber(background.l5)}</td>}
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-bold text-gray-900 bg-gray-50 border-r">L10 (dB)</td>
                    <td className="px-4 py-3 text-center border-r">{formatNumber(source.l10)}</td>
                    {isSource && background && <td className="px-4 py-3 text-center">{formatNumber(background.l10)}</td>}
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-bold text-gray-900 bg-gray-50 border-r">L50 (dB)</td>
                    <td className="px-4 py-3 text-center border-r">{formatNumber(source.l50)}</td>
                    {isSource && background && <td className="px-4 py-3 text-center">{formatNumber(background.l50)}</td>}
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-bold text-gray-900 bg-gray-50 border-r">L90 (dB)</td>
                    <td className="px-4 py-3 text-center border-r">{formatNumber(source.l90)}</td>
                    {isSource && background && <td className="px-4 py-3 text-center">{formatNumber(background.l90)}</td>}
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-bold text-gray-900 bg-gray-50 border-r">L95 (dB)</td>
                    <td className="px-4 py-3 text-center border-r">{formatNumber(source.l95)}</td>
                    {isSource && background && <td className="px-4 py-3 text-center">{formatNumber(background.l95)}</td>}
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-bold text-gray-900 bg-gray-50 border-r">Min (dB)</td>
                    <td className="px-4 py-3 text-center border-r">{formatNumber(source.min)}</td>
                    {isSource && background && <td className="px-4 py-3 text-center">{formatNumber(background.min)}</td>}
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-bold text-gray-900 bg-gray-50 border-r">Max (dB)</td>
                    <td className="px-4 py-3 text-center border-r">{formatNumber(source.max)}</td>
                    {isSource && background && <td className="px-4 py-3 text-center">{formatNumber(background.max)}</td>}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Frequency Table */}
          <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 p-4 border-b">
              <h3 className="font-bold text-gray-900">
                Frekvenční spektrum - 1/3 oktávová pásma (dB)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-center text-xs font-bold text-gray-700 uppercase border-r">
                      Typ
                    </th>
                    {STATIONARY_FREQUENCY_LIST.map(freq => (
                      <th key={freq} className="px-2 py-2 text-center text-xs font-medium text-gray-700 border-r">
                        {freq}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr className={`${isSource ? 'hover:bg-orange-50' : 'hover:bg-green-50'}`}>
                    <td className={`px-3 py-2 font-bold text-gray-900 ${isSource ? 'bg-orange-50' : 'bg-green-50'} border-r`}>
                      {source.name || (isSource ? 'Zdroj' : 'Pozadí')}
                    </td>
                    {source.avgFrequencies.map((value, i) => (
                      <td key={i} className="px-2 py-2 text-center border-r">
                        {formatNumber(value)}
                      </td>
                    ))}
                  </tr>
                  {isSource && background && (
                    <tr className="hover:bg-green-50">
                      <td className="px-3 py-2 font-bold text-gray-900 bg-green-50 border-r">
                        {background.name || 'Pozadí'}
                      </td>
                      {background.avgFrequencies.map((value, i) => (
                        <td key={i} className="px-2 py-2 text-center border-r">
                          {formatNumber(value)}
                        </td>
                      ))}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
