'use client';

import { useRef } from 'react';
import * as XLSX from 'xlsx';
import { ImpulseData } from '@/app/impulzni-hluk/page';

interface ImpulseFileUploadProps {
  onDataLoaded: (data: ImpulseData[], fileName: string) => void;
}

export default function ImpulseFileUpload({ onDataLoaded }: ImpulseFileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Logaritmický průměr dvou hodnot v dB
   */
  const logAverage = (dB1: number, dB2: number): number => {
    const p1 = Math.pow(10, dB1 / 10);
    const p2 = Math.pow(10, dB2 / 10);
    return 10 * Math.log10((p1 + p2) / 2);
  };

  /**
   * Energetické odečtení pozadí od signálu
   * Signal - Background (v dB) = 10 * log10(10^(Signal/10) - 10^(Background/10))
   */
  const subtractBackground = (signalDb: number, backgroundDb: number): number => {
    const signalPower = Math.pow(10, signalDb / 10);
    const backgroundPower = Math.pow(10, backgroundDb / 10);

    if (signalPower <= backgroundPower) {
      // Signal je menší nebo roven pozadí - nemůžeme odečíst
      return signalDb; // Vrátíme původní hodnotu
    }

    const correctedPower = signalPower - backgroundPower;
    return 10 * Math.log10(correctedPower);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);

      const parsedData: ImpulseData[] = jsonData.map((row: any) => {
        // Parse timestamp
        let timestamp: Date;
        if (row['Datum a čas'] || row['Datum a cas']) {
          const dateStr = row['Datum a čas'] || row['Datum a cas'];
          timestamp = parseExcelDate(dateStr);
        } else if (row['Datum'] && row['Čas']) {
          const dateStr = `${row['Datum']} ${row['Čas']}`;
          timestamp = parseExcelDate(dateStr);
        } else if (row['Datum'] && row['Cas']) {
          const dateStr = `${row['Datum']} ${row['Cas']}`;
          timestamp = parseExcelDate(dateStr);
        } else {
          timestamp = new Date();
        }

        // Parse LAImax (REQUIRED)
        const lAImax = parseFloat(
          row['LAImax'] || row['LAIMax'] || row['L AImax'] || row['AImax'] || '0'
        );

        // Parse LASmax (REQUIRED)
        const lASmax = parseFloat(
          row['LASmax'] || row['LASMax'] || row['L ASmax'] || row['ASmax'] || '0'
        );

        // Parse LAeq (REQUIRED)
        const lAeqRaw = parseFloat(
          row['LAeq'] || row['LAEq'] || row['L Aeq'] || row['Aeq'] || '0'
        );

        // Parse background values (OPTIONAL)
        const backgroundBefore = row['Pozadí před'] || row['Pozadi pred'] || row['Background before'] || row['Bg before']
          ? parseFloat(row['Pozadí před'] || row['Pozadi pred'] || row['Background before'] || row['Bg before'])
          : undefined;

        const backgroundAfter = row['Pozadí po'] || row['Pozadi po'] || row['Background after'] || row['Bg after']
          ? parseFloat(row['Pozadí po'] || row['Pozadi po'] || row['Background after'] || row['Bg after'])
          : undefined;

        // Calculate background average and corrected LAeq
        let backgroundAvg: number | undefined;
        let lAeq = lAeqRaw;

        if (backgroundBefore !== undefined && backgroundAfter !== undefined) {
          // Both background values available
          backgroundAvg = logAverage(backgroundBefore, backgroundAfter);
          lAeq = subtractBackground(lAeqRaw, backgroundAvg);
        } else if (backgroundBefore !== undefined) {
          // Only before available
          backgroundAvg = backgroundBefore;
          lAeq = subtractBackground(lAeqRaw, backgroundAvg);
        } else if (backgroundAfter !== undefined) {
          // Only after available
          backgroundAvg = backgroundAfter;
          lAeq = subtractBackground(lAeqRaw, backgroundAvg);
        }
        // Else: no background correction

        // Calculate if highly impulsive
        const difference = lAImax - lASmax;
        const isHighlyImpulsive = difference > 5.0;

        // Parse optional fields
        const duration = row['Délka'] || row['Delka'] || row['Duration'] || row['Trvání'] || row['Trvani']
          ? parseFloat(row['Délka'] || row['Delka'] || row['Duration'] || row['Trvání'] || row['Trvani'])
          : undefined;

        const source = row['Zdroj'] || row['Source'] || row['Typ'] || row['Type'] || undefined;

        return {
          timestamp,
          lAImax,
          lASmax,
          lAeq,
          lAeqRaw,
          backgroundBefore,
          backgroundAfter,
          backgroundAvg,
          duration,
          source,
          isHighlyImpulsive,
        };
      });

      // Filter out invalid data (missing required fields)
      const validData = parsedData.filter(
        (d) => !isNaN(d.lAImax) && d.lAImax > 0 &&
               !isNaN(d.lASmax) && d.lASmax > 0 &&
               !isNaN(d.lAeq) && d.lAeq > 0
      );

      if (validData.length === 0) {
        alert('Soubor neobsahuje platná data.\n\nPožadované sloupce:\n- LAImax\n- LASmax\n- LAeq\n\nZkontrolujte formát souboru.');
        return;
      }

      // Show summary
      const highlyImpulsiveCount = validData.filter(d => d.isHighlyImpulsive).length;
      const correctedCount = validData.filter(d => d.backgroundAvg !== undefined).length;

      console.log(`Načteno ${validData.length} impulzů:`);
      console.log(`- ${highlyImpulsiveCount} vysoce impulsních (LAImax - LASmax > 5 dB)`);
      console.log(`- ${correctedCount} s korekcí na pozadí`);

      onDataLoaded(validData, file.name);
    } catch (error) {
      console.error('Error parsing file:', error);
      alert('Chyba při načítání souboru.\n\nZkontrolujte:\n1. Formát souboru (Excel/CSV)\n2. Názvy sloupců (LAImax, LASmax, LAeq)\n3. Číselné hodnoty v dB');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const parseExcelDate = (dateStr: any): Date => {
    if (dateStr instanceof Date) return dateStr;
    if (typeof dateStr === 'number') {
      return new Date((dateStr - 25569) * 86400 * 1000);
    }
    const str = String(dateStr);
    const czechMatch = str.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})\s+(\d{1,2}):(\d{2})/);
    if (czechMatch) {
      const [, day, month, year, hour, minute] = czechMatch;
      return new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour),
        parseInt(minute)
      );
    }
    const isoDate = new Date(str);
    if (!isNaN(isoDate.getTime())) {
      return isoDate;
    }
    return new Date();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">💥</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Nahrát data vysoce impulsního hluku
          </h2>
          <p className="text-gray-600 mb-6">
            Excel nebo CSV soubor s měřeními podle NV 272/2011 Sb.
          </p>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-500 transition-colors">
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
                <li><strong>Datum a čas</strong> nebo <strong>Datum</strong> + <strong>Čas</strong></li>
                <li><strong>LAImax</strong> - Maximum s Impulse charakteristikou [dB(A)]</li>
                <li><strong>LASmax</strong> - Maximum se Slow charakteristikou [dB(A)]</li>
                <li><strong>LAeq</strong> - Ekvivalentní hladina impulzu [dB(A)]</li>
              </ul>

              <p className="font-medium mt-4">Volitelné sloupce:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Pozadí před</strong> - Pozadí 1s před impulsem [dB(A)]</li>
                <li><strong>Pozadí po</strong> - Pozadí 1s po impulsem [dB(A)]</li>
                <li><strong>Délka</strong> - Délka impulzu [ms]</li>
                <li><strong>Zdroj</strong> - Popis zdroje impulzu</li>
              </ul>
            </div>

            <div className="mt-4 p-4 bg-white rounded border border-blue-200">
              <p className="text-xs font-mono text-gray-700 mb-2">
                <strong>Příklad:</strong>
              </p>
              <div className="overflow-x-auto">
                <table className="text-xs font-mono w-full">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="text-left py-1 px-2">Datum a čas</th>
                      <th className="text-left py-1 px-2">LAImax</th>
                      <th className="text-left py-1 px-2">LASmax</th>
                      <th className="text-left py-1 px-2">LAeq</th>
                      <th className="text-left py-1 px-2">Pozadí před</th>
                      <th className="text-left py-1 px-2">Pozadí po</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-1 px-2">14.3.2024 10:15</td>
                      <td className="py-1 px-2">118.5</td>
                      <td className="py-1 px-2">105.2</td>
                      <td className="py-1 px-2">98.3</td>
                      <td className="py-1 px-2">45.2</td>
                      <td className="py-1 px-2">46.1</td>
                    </tr>
                    <tr>
                      <td className="py-1 px-2">14.3.2024 10:47</td>
                      <td className="py-1 px-2">122.1</td>
                      <td className="py-1 px-2">108.5</td>
                      <td className="py-1 px-2">102.8</td>
                      <td className="py-1 px-2">46.5</td>
                      <td className="py-1 px-2">45.8</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded">
              <p className="text-xs text-yellow-900">
                <strong>⚠️ Poznámka:</strong> Pokud zadáte hodnoty pozadí (před/po),
                aplikace automaticky provede energetické odečtení pozadí od LAeq impulzu.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
