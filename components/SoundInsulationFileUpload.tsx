'use client';

import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { FrequencyMeasurement, RoomParameters, STANDARD_FREQUENCIES } from '@/app/nepruzvucnost/page';

interface SoundInsulationFileUploadProps {
  onDataLoaded: (
    measurements: FrequencyMeasurement[],
    fileName: string
  ) => void;
}

export default function SoundInsulationFileUpload({ onDataLoaded }: SoundInsulationFileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  // Helper funkce pro parsování čísel s desetinnou čárkou i tečkou
  const parseNumber = (value: any): number => {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      // Nahradit čárku tečkou pro parsování
      const normalized = value.replace(',', '.');
      return parseFloat(normalized);
    }
    return 0;
  };

  const processFile = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const measurements: FrequencyMeasurement[] = jsonData.map((row: any) => {
        // Parse frequency
        const frequency = parseNumber(
          row['Frekvence'] || row['Frekvence [Hz]'] || row['frequency'] ||
          row['Frequency'] || row['f'] || '0'
        );

        // Parse L1 (sending room level)
        const L1 = parseNumber(
          row['L1'] || row['L1 [dB]'] || row['L1 dB'] ||
          row['Vysílací'] || row['Vysilaci'] || '0'
        );

        // Parse L2 (receiving room level)
        const L2 = parseNumber(
          row['L2'] || row['L2 [dB]'] || row['L2 dB'] ||
          row['Přijímací'] || row['Prijimaci'] || '0'
        );

        // Parse T (reverberation time)
        const T = parseNumber(
          row['T'] || row['T [s]'] || row['T s'] ||
          row['Doba dozvuku'] || row['RT'] || '0'
        );

        return { frequency, L1, L2, T };
      });

      // Filter valid measurements
      const validMeasurements = measurements.filter(
        (m) => m.frequency > 0 && m.L1 > 0 && m.L2 > 0 && m.T > 0
      );

      if (validMeasurements.length === 0) {
        alert(
          'Soubor neobsahuje platná data.\n\n' +
          'Požadované sloupce:\n' +
          '- Frekvence (Hz)\n' +
          '- L1 (dB) - hladina ve vysílací místnosti\n' +
          '- L2 (dB) - hladina v přijímací místnosti\n' +
          '- T (s) - doba dozvuku\n\n' +
          'Zkontrolujte formát souboru.'
        );
        return;
      }

      // Sort by frequency
      validMeasurements.sort((a, b) => a.frequency - b.frequency);

      console.log(`Načteno ${validMeasurements.length} měření:`);
      console.log(`- Frekvence: ${validMeasurements[0].frequency} Hz - ${validMeasurements[validMeasurements.length - 1].frequency} Hz`);

      onDataLoaded(validMeasurements, file.name);
    } catch (error) {
      console.error('Error parsing file:', error);
      alert(
        'Chyba při načítání souboru.\n\n' +
        'Zkontrolujte:\n' +
        '1. Formát souboru (Excel/CSV)\n' +
        '2. Názvy sloupců (Frekvence, L1, L2, T)\n' +
        '3. Číselné hodnoty (desetinné čárky jsou podporovány)'
      );
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await processFile(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🔇</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Nahrát měření neprůzvučnosti
          </h2>
          <p className="text-gray-600">
            Excel nebo CSV soubor s měřením na tercových pásmech
          </p>
        </div>

        {/* File Upload */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-blue-500'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <svg
              className="w-16 h-16 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <span className="text-lg font-medium text-gray-700 mb-2">
              Klikněte pro výběr souboru
            </span>
            <span className="text-sm text-gray-500">
              nebo přetáhněte soubor sem
            </span>
            <span className="text-xs text-gray-400 mt-2">
              .xlsx, .xls, .csv
            </span>
          </label>
        </div>

        {/* Format Info */}
        <div className="mt-8 text-left bg-blue-50 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">
            📋 Požadovaný formát souboru:
          </h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p className="font-medium">Povinné sloupce:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Frekvence</strong> nebo <strong>frequency</strong> - Střední frekvence tercového pásma [Hz]</li>
              <li><strong>L1</strong> - Hladina akustického tlaku ve vysílací místnosti [dB]</li>
              <li><strong>L2</strong> - Hladina akustického tlaku v přijímací místnosti [dB]</li>
              <li><strong>T</strong> - Doba dozvuku v přijímací místnosti [s]</li>
            </ul>

            <div className="mt-4 p-4 bg-white rounded border border-blue-200">
              <p className="text-xs font-mono text-gray-700 mb-2">
                <strong>Příklad:</strong>
              </p>
              <div className="overflow-x-auto">
                <table className="text-xs font-mono w-full">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="text-left py-1 px-2">Frekvence [Hz]</th>
                      <th className="text-left py-1 px-2">L1 [dB]</th>
                      <th className="text-left py-1 px-2">L2 [dB]</th>
                      <th className="text-left py-1 px-2">T [s]</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-gray-50">
                      <td className="py-1 px-2">50</td>
                      <td className="py-1 px-2">85.2</td>
                      <td className="py-1 px-2">42.1</td>
                      <td className="py-1 px-2">0.80</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="py-1 px-2">63</td>
                      <td className="py-1 px-2">87.5</td>
                      <td className="py-1 px-2">43.8</td>
                      <td className="py-1 px-2">0.75</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="py-1 px-2">80</td>
                      <td className="py-1 px-2">89.1</td>
                      <td className="py-1 px-2">45.2</td>
                      <td className="py-1 px-2">0.72</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <p className="text-xs text-blue-700 mt-3 italic">
              <strong>Poznámka:</strong> Standardní rozsah je 50-5000 Hz (tercová pásma podle ČSN EN ISO 16283-1).
              Můžete použít i kratší rozsah 100-3150 Hz.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
