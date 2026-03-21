'use client';

import { useRef } from 'react';
import { VibrationTrain, FREQUENCY_LIST, LIMIT_DB } from '@/types/vibration';
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface VibrationTrainDetailProps {
  train: VibrationTrain;
  onClose: () => void;
}

export function VibrationTrainDetail({ train, onClose }: VibrationTrainDetailProps) {
  const chartRef = useRef<ChartJS<'bar'>>(null);
  // Prepare chart data - pouze osy X, Y, Z
  const chartData = {
    labels: [...FREQUENCY_LIST.map(f => f.toString()), 'Law'],
    datasets: [
      {
        label: 'osa X',
        data: [...train.rmsX, train.lawX],
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
        borderColor: 'rgba(220, 38, 38, 1)',
        borderWidth: 1,
        barPercentage: 1.0,
        categoryPercentage: 1.0,
      },
      {
        label: 'osa Y',
        data: [...train.rmsY, train.lawY],
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgba(37, 99, 235, 1)',
        borderWidth: 1,
        barPercentage: 1.0,
        categoryPercentage: 1.0,
      },
      {
        label: 'osa Z',
        data: [...train.rmsZ, train.lawZ],
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
        borderColor: 'rgba(22, 163, 74, 1)',
        borderWidth: 1,
        barPercentage: 1.0,
        categoryPercentage: 1.0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Vážené hladiny zrychlení vibrací',
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
              label += context.parsed.y.toFixed(1) + ' dB';
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
          text: '1/3 oktávová pásma [Hz]',
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
        max: 90,
      },
    },
  };

  const startTime = `${train.startTime.getHours().toString().padStart(2, '0')}:${train.startTime.getMinutes().toString().padStart(2, '0')}:${train.startTime.getSeconds().toString().padStart(2, '0')}`;
  const endTime = `${train.endTime.getHours().toString().padStart(2, '0')}:${train.endTime.getMinutes().toString().padStart(2, '0')}:${train.endTime.getSeconds().toString().padStart(2, '0')}`;

  const handleExportToExcel = async () => {
    const wb = XLSX.utils.book_new();

    // Prepare table data
    const tableData = [
      ['Vážené hladiny zrychlení vibrací v dB pro jednotlivá frekvenční pásma (Hz)'],
      [''],
      ['Osa', ...FREQUENCY_LIST.map(f => f.toString()), 'Law (dB)', 'Limit (dB)'],
      ['X', ...train.rmsX.map(v => v.toFixed(1)), train.lawX.toFixed(1), LIMIT_DB.toFixed(1)],
      ['Y', ...train.rmsY.map(v => v.toFixed(1)), train.lawY.toFixed(1), LIMIT_DB.toFixed(1)],
      ['Z', ...train.rmsZ.map(v => v.toFixed(1)), train.lawZ.toFixed(1), LIMIT_DB.toFixed(1)],
    ];

    const ws = XLSX.utils.aoa_to_sheet(tableData);

    // Add chart image if available
    if (chartRef.current) {
      const chartCanvas = chartRef.current.canvas;
      if (chartCanvas) {
        // Convert canvas to base64 image
        const imageData = chartCanvas.toDataURL('image/png');

        // Add image to worksheet (starting at row 10)
        // Note: XLSX doesn't support images directly in free version
        // We'll add a note instead
        XLSX.utils.sheet_add_aoa(ws, [
          [''],
          ['Graf vibrací je dostupný v aplikaci'],
          ['Pro export grafu použijte screenshot nebo print'],
        ], { origin: 'A10' });
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, 'Detail vlaku');

    const filename = `vibrace_vlak_${startTime.replace(/:/g, '-')}_${train.trakce || 'neznama'}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-xl flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Detail průjezdu vlaku</h2>
            <p className="text-blue-100 mt-1">
              {startTime} - {endTime} | {train.trakce} | {train.druhVlaku}
            </p>
          </div>
          <div className="flex items-center gap-3">
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

          {/* Table */}
          <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 p-4 border-b">
              <h3 className="font-bold text-gray-900">
                Vážené hladiny zrychlení vibrací v dB pro jednotlivá frekvenční pásma (Hz)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase border-r">
                      Osa
                    </th>
                    {FREQUENCY_LIST.map(freq => (
                      <th key={freq} className="px-3 py-3 text-center text-xs font-medium text-gray-700 border-r">
                        {freq}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase border-r bg-blue-50">
                      L<sub>aw</sub><br/>(dB)
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase bg-gray-200">
                      Limit<br/>(dB)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {/* X Axis */}
                  <tr className="hover:bg-red-50">
                    <td className="px-4 py-3 font-bold text-gray-900 bg-red-50 border-r">
                      X
                    </td>
                    {train.rmsX.map((value, i) => (
                      <td key={i} className="px-3 py-3 text-center border-r">
                        {value.toFixed(1)}
                      </td>
                    ))}
                    <td className={`px-4 py-3 text-center font-bold border-r ${train.lawX > LIMIT_DB ? 'bg-red-100 text-red-700' : 'bg-blue-50'}`}>
                      {train.lawX.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-center font-bold bg-gray-100">
                      {LIMIT_DB.toFixed(1)}
                    </td>
                  </tr>

                  {/* Y Axis */}
                  <tr className="hover:bg-blue-50">
                    <td className="px-4 py-3 font-bold text-gray-900 bg-blue-50 border-r">
                      Y
                    </td>
                    {train.rmsY.map((value, i) => (
                      <td key={i} className="px-3 py-3 text-center border-r">
                        {value.toFixed(1)}
                      </td>
                    ))}
                    <td className={`px-4 py-3 text-center font-bold border-r ${train.lawY > LIMIT_DB ? 'bg-red-100 text-red-700' : 'bg-blue-50'}`}>
                      {train.lawY.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-center font-bold bg-gray-100">
                      {LIMIT_DB.toFixed(1)}
                    </td>
                  </tr>

                  {/* Z Axis */}
                  <tr className="hover:bg-green-50">
                    <td className="px-4 py-3 font-bold text-gray-900 bg-green-50 border-r">
                      Z
                    </td>
                    {train.rmsZ.map((value, i) => (
                      <td key={i} className="px-3 py-3 text-center border-r">
                        {value.toFixed(1)}
                      </td>
                    ))}
                    <td className={`px-4 py-3 text-center font-bold border-r ${train.lawZ > LIMIT_DB ? 'bg-red-100 text-red-700' : 'bg-blue-50'}`}>
                      {train.lawZ.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-center font-bold bg-gray-100">
                      {LIMIT_DB.toFixed(1)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
