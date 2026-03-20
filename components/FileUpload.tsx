'use client';

import { useState } from 'react';
import { parseExcelFile } from '@/lib/excel-parser';
import { NoiseData } from '@/types';

interface FileUploadProps {
  onDataLoaded: (data: NoiseData) => void;
}

export function FileUpload({ onDataLoaded }: FileUploadProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = async (file: File) => {
    setLoading(true);
    setError(null);

    try {
      // Check file type
      const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
      ];

      if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx?|csv)$/i)) {
        throw new Error('Prosím nahraj Excel soubor (.xlsx, .xls) nebo CSV');
      }

      const data = await parseExcelFile(file);
      onDataLoaded(data);
    } catch (err: any) {
      setError(err.message || 'Chyba při načítání souboru');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <div
        className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept=".xlsx,.xls,.csv"
          onChange={handleChange}
          disabled={loading}
        />

        {loading ? (
          <div className="space-y-4">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="text-gray-600">Načítám data...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>

            <div>
              <label
                htmlFor="file-upload"
                className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Vybrat soubor
              </label>
            </div>

            <p className="text-sm text-gray-600">
              nebo přetáhni Excel soubor sem
            </p>

            <p className="text-xs text-gray-500">
              Podporované formáty: .xlsx, .xls, .csv
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="mt-6 space-y-4">
        <div className="p-4 bg-gray-50 rounded-md">
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            Očekávaný formát Excel souboru:
          </h3>
          <div className="text-xs text-gray-600 space-y-1">
            <p>• <strong>Sloupec 1:</strong> Datum (DD.MM.YYYY nebo Excel datum)</p>
            <p>• <strong>Sloupec 2:</strong> Čas (HH:MM nebo Excel čas)</p>
            <p>• <strong>Sloupec 3:</strong> Hodnota hluku v dB</p>
            <p className="mt-2 text-gray-500">Alternativně: Datum+Čas v jednom sloupci, hodnota ve druhém</p>
          </div>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
            ℹ️ Logaritmické průměrování
          </h3>
          <div className="text-xs text-blue-800 space-y-1">
            <p>Decibely se <strong>nesmí průměrovat aritmeticky</strong>!</p>
            <p>Aplikace používá <strong>správný logaritmický vzorec</strong>:</p>
            <p className="font-mono bg-white px-2 py-1 rounded mt-1">
              L<sub>eq</sub> = 10 × log₁₀(1/n × Σ 10^(L<sub>i</sub>/10))
            </p>
            <p className="mt-2 text-blue-700">
              Výsledné průměry odpovídají ekvivalentní hladině hluku (L<sub>eq</sub>).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
