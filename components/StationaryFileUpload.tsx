'use client';

import { useState } from 'react';
import { parseStationaryExcel } from '@/lib/stationaryParser';
import { StationaryData } from '@/types/stationary';

interface StationaryFileUploadProps {
  onDataLoaded: (data: StationaryData) => void;
}

export function StationaryFileUpload({ onDataLoaded }: StationaryFileUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await parseStationaryExcel(file);
      onDataLoaded(data);
    } catch (err) {
      console.error('Error parsing Excel:', err);
      setError(err instanceof Error ? err.message : 'Chyba při načítání souboru');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-dashed border-orange-300 hover:border-orange-500 transition-colors">
      <div className="text-center">
        <div className="text-6xl mb-4">🏭</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Nahraj Excel soubor s měřením
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Soubor musí obsahovat sloupce: Datum, Čas, LAeq, 31 frekvencí (20 Hz - 20 kHz)
        </p>

        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileUpload}
          disabled={isLoading}
          className="block w-full text-sm text-gray-900 border border-orange-300 rounded-lg cursor-pointer bg-orange-50 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-600 file:text-white hover:file:bg-orange-700 disabled:opacity-50"
        />

        {isLoading && (
          <div className="mt-4 text-orange-600">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-orange-600 border-t-transparent"></div>
            <p className="mt-2">Načítám data...</p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <strong>Chyba:</strong> {error}
          </div>
        )}
      </div>
    </div>
  );
}
