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

      // Parsování jako JSON s prvním sloupcem jako header
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        alert('Soubor je prázdný nebo nemá správný formát.');
        return;
      }

      // Detekce formátu - transponovaný (řádky) nebo klasický (sloupce)
      const firstRow: any = jsonData[0];
      const keys = Object.keys(firstRow);

      // Pokud první řádek má klíče s čísly nebo názvem Frekvence, je to transponovaný formát
      const isTransposed = keys.some(k =>
        !isNaN(parseNumber(k)) ||
        k.toLowerCase().includes('frekvence') ||
        k.toLowerCase().includes('frequency')
      );

      let measurements: FrequencyMeasurement[] = [];

      if (isTransposed) {
        // TRANSPONOVANÝ FORMÁT - Frekvence v řádcích
        console.log('Detekován transponovaný formát (frekvence v řádcích)');

        // Najít řádky s jednotlivými veličinami
        let freqRow: any = null;
        let l1Row: any = null;
        let l2Row: any = null;
        let tRow: any = null;

        jsonData.forEach((row: any) => {
          const firstCell = Object.values(row)[0];
          const firstCellStr = String(firstCell).toLowerCase().trim();

          if (firstCellStr.includes('frekvence') || firstCellStr.includes('frequency') || firstCellStr === 'f') {
            freqRow = row;
          } else if (firstCellStr === 'l1' || firstCellStr.includes('vysílací') || firstCellStr.includes('vysilaci')) {
            l1Row = row;
          } else if (firstCellStr === 'l2' || firstCellStr.includes('přijímací') || firstCellStr.includes('prijimaci')) {
            l2Row = row;
          } else if (firstCellStr === 't' || firstCellStr.includes('dozvuk')) {
            tRow = row;
          }
        });

        if (!freqRow || !l1Row || !l2Row || !tRow) {
          alert(
            'Soubor neobsahuje všechny povinné řádky.\n\n' +
            'Požadované řádky (v prvním sloupci):\n' +
            '- Frekvence (nebo frequency, f)\n' +
            '- L1 (hladina ve vysílací místnosti)\n' +
            '- L2 (hladina v přijímací místnosti)\n' +
            '- T (doba dozvuku)\n\n' +
            'Nalezeno:\n' +
            `- Frekvence: ${freqRow ? '✓' : '✗'}\n` +
            `- L1: ${l1Row ? '✓' : '✗'}\n` +
            `- L2: ${l2Row ? '✓' : '✗'}\n` +
            `- T: ${tRow ? '✓' : '✗'}`
          );
          return;
        }

        // Získat klíče (názvy sloupců) kromě prvního
        const columnKeys = Object.keys(freqRow).slice(1);

        // Pro každý sloupec vytvořit měření
        columnKeys.forEach((key) => {
          const frequency = parseNumber(freqRow[key]);
          const L1 = parseNumber(l1Row[key]);
          const L2 = parseNumber(l2Row[key]);
          const T = parseNumber(tRow[key]);

          if (frequency > 0 && L1 > 0 && L2 > 0 && T > 0) {
            measurements.push({ frequency, L1, L2, T });
          }
        });

      } else {
        // KLASICKÝ FORMÁT - Frekvence ve sloupcích
        console.log('Detekován klasický formát (frekvence ve sloupcích)');

        measurements = jsonData.map((row: any) => {
          const frequency = parseNumber(
            row['Frekvence'] || row['Frekvence [Hz]'] || row['frequency'] ||
            row['Frequency'] || row['f'] || '0'
          );

          const L1 = parseNumber(
            row['L1'] || row['L1 [dB]'] || row['L1 dB'] ||
            row['Vysílací'] || row['Vysilaci'] || '0'
          );

          const L2 = parseNumber(
            row['L2'] || row['L2 [dB]'] || row['L2 dB'] ||
            row['Přijímací'] || row['Prijimaci'] || '0'
          );

          const T = parseNumber(
            row['T'] || row['T [s]'] || row['T s'] ||
            row['Doba dozvuku'] || row['RT'] || '0'
          );

          return { frequency, L1, L2, T };
        });

        // Filter valid measurements
        measurements = measurements.filter(
          (m) => m.frequency > 0 && m.L1 > 0 && m.L2 > 0 && m.T > 0
        );
      }

      if (measurements.length === 0) {
        alert(
          'Soubor neobsahuje platná data.\n\n' +
          'Zkontrolujte formát souboru a hodnoty.'
        );
        return;
      }

      // Sort by frequency
      measurements.sort((a, b) => a.frequency - b.frequency);

      console.log(`Načteno ${measurements.length} měření:`);
      console.log(`- Frekvence: ${measurements[0].frequency} Hz - ${measurements[measurements.length - 1].frequency} Hz`);

      onDataLoaded(measurements, file.name);
    } catch (error) {
      console.error('Error parsing file:', error);
      alert(
        'Chyba při načítání souboru.\n\n' +
        'Zkontrolujte:\n' +
        '1. Formát souboru (Excel/CSV)\n' +
        '2. Formát dat (podporovány oba formáty - řádky i sloupce)\n' +
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
            <p className="font-medium">Transponovaný formát (frekvence v řádcích):</p>
            <p className="text-xs">
              První sloupec obsahuje názvy veličin, další sloupce obsahují hodnoty pro jednotlivé frekvence.
            </p>

            <div className="mt-4 p-4 bg-white rounded border border-blue-200">
              <p className="text-xs font-mono text-gray-700 mb-2">
                <strong>Příklad:</strong>
              </p>
              <div className="overflow-x-auto">
                <table className="text-xs font-mono w-full">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="text-left py-1 px-2 bg-gray-100">Veličina</th>
                      <th className="text-left py-1 px-2">100 Hz</th>
                      <th className="text-left py-1 px-2">125 Hz</th>
                      <th className="text-left py-1 px-2">160 Hz</th>
                      <th className="text-left py-1 px-2">...</th>
                      <th className="text-left py-1 px-2">3150 Hz</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-gray-50">
                      <td className="py-1 px-2 font-semibold">Frekvence</td>
                      <td className="py-1 px-2">100</td>
                      <td className="py-1 px-2">125</td>
                      <td className="py-1 px-2">160</td>
                      <td className="py-1 px-2">...</td>
                      <td className="py-1 px-2">3150</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="py-1 px-2 font-semibold">L1</td>
                      <td className="py-1 px-2">85,2</td>
                      <td className="py-1 px-2">87,5</td>
                      <td className="py-1 px-2">89,1</td>
                      <td className="py-1 px-2">...</td>
                      <td className="py-1 px-2">78,3</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="py-1 px-2 font-semibold">L2</td>
                      <td className="py-1 px-2">42,1</td>
                      <td className="py-1 px-2">43,8</td>
                      <td className="py-1 px-2">45,2</td>
                      <td className="py-1 px-2">...</td>
                      <td className="py-1 px-2">35,6</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="py-1 px-2 font-semibold">T</td>
                      <td className="py-1 px-2">0,80</td>
                      <td className="py-1 px-2">0,75</td>
                      <td className="py-1 px-2">0,72</td>
                      <td className="py-1 px-2">...</td>
                      <td className="py-1 px-2">0,55</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
              <p className="text-xs text-green-800">
                <strong>✓ Povinné řádky v prvním sloupci:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4 text-xs text-green-700 mt-1">
                <li><strong>Frekvence</strong> (nebo frequency, f) - Tercová pásma [Hz]</li>
                <li><strong>L1</strong> - Hladina ve vysílací místnosti [dB]</li>
                <li><strong>L2</strong> - Hladina v přijímací místnosti [dB]</li>
                <li><strong>T</strong> - Doba dozvuku [s]</li>
              </ul>
            </div>

            <p className="text-xs text-blue-700 mt-3 italic">
              <strong>Poznámka:</strong> Podporovány jsou desetinné čárky i tečky.
              Standardní rozsah: 100-3150 Hz (tercová pásma podle ČSN EN ISO 717-1 pro hodnocení).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
