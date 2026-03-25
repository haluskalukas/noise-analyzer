'use client';

import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { MeasurementData, ImpulseData } from '@/app/impulzni-hluk/page';

interface ImpulseFileUploadProps {
  onDataLoaded: (impulses: ImpulseData[], allMeasurements: MeasurementData[], fileName: string) => void;
}

export default function ImpulseFileUpload({ onDataLoaded }: ImpulseFileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

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
   */
  const subtractBackground = (signalDb: number, backgroundDb: number): number => {
    const signalPower = Math.pow(10, signalDb / 10);
    const backgroundPower = Math.pow(10, backgroundDb / 10);

    if (signalPower <= backgroundPower) {
      return signalDb; // Nemůžeme odečíst, vrátíme původní hodnotu
    }

    const correctedPower = signalPower - backgroundPower;
    return 10 * Math.log10(correctedPower);
  };

  /**
   * Zjistí, zda je čas ve dne (6:00-22:00)
   */
  const isDaytime = (date: Date): boolean => {
    const hours = date.getHours();
    return hours >= 6 && hours < 22;
  };

  const processFile = async (file: File) => {

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Parsovat všechna měření (1s data)
      const measurements: MeasurementData[] = jsonData.map((row: any) => {
        // Parse timestamp
        let timestamp: Date;

        // Varianta 1: "Datum a čas" v jednom sloupci
        if (row['Datum a čas'] || row['Datum a cas']) {
          const dateStr = row['Datum a čas'] || row['Datum a cas'];
          timestamp = parseExcelDate(dateStr);
        }
        // Varianta 2: "Datum" a "Čas" v oddělených sloupcích (české názvy)
        else if (row['Datum'] && (row['Čas'] || row['Cas'] || row['čas'])) {
          const dateValue = row['Datum'];
          const timeValue = row['Čas'] || row['Cas'] || row['čas'];
          timestamp = parseSeparateDateAndTime(dateValue, timeValue);
        }
        // Varianta 3: "date" a "time" v oddělených sloupcích (anglické názvy)
        else if (row['date'] && row['time']) {
          const dateValue = row['date'];
          const timeValue = row['time'];
          timestamp = parseSeparateDateAndTime(dateValue, timeValue);
        }
        // Fallback
        else {
          timestamp = new Date();
        }

        // Parse LAeq (české i anglické varianty)
        const lAeq = parseFloat(
          row['LAeq'] || row['LAEq'] || row['L Aeq'] || row['Aeq'] || row['Leq'] ||
          row['Laeq'] || row['laeq'] || '0'
        );

        // Parse LAImax (české i anglické varianty)
        const lAImax = parseFloat(
          row['LAImax'] || row['LAIMax'] || row['L AImax'] || row['AImax'] ||
          row['LaIMAX'] || row['LAIMAX'] || row['laimax'] || '0'
        );

        // Parse LASmax (české i anglické varianty)
        const lASmax = parseFloat(
          row['LASmax'] || row['LASMax'] || row['L ASmax'] || row['ASmax'] ||
          row['LASMAX'] || row['lasmax'] || '0'
        );

        return {
          timestamp,
          lAeq,
          lAImax,
          lASmax,
        };
      });

      // Filtrovat platná data
      const validMeasurements = measurements.filter(
        (m) => !isNaN(m.lAeq) && m.lAeq > 0 &&
               !isNaN(m.lAImax) && m.lAImax > 0 &&
               !isNaN(m.lASmax) && m.lASmax > 0
      );

      if (validMeasurements.length === 0) {
        alert('Soubor neobsahuje platná data.\n\nPožadované sloupce:\n- Datum a čas\n- LAeq\n- LAImax\n- LASmax\n\nZkontrolujte formát souboru.');
        return;
      }

      // Identifikovat impulsy (LAImax - LASmax > 5 dB)
      const impulses: ImpulseData[] = [];

      for (let i = 0; i < validMeasurements.length; i++) {
        const current = validMeasurements[i];
        const difference = current.lAImax - current.lASmax;

        // Je to impuls?
        if (difference > 5.0) {
          // Získat LAeq 1s před a po
          const before = i > 0 ? validMeasurements[i - 1].lAeq : current.lAeq;
          const after = i < validMeasurements.length - 1 ? validMeasurements[i + 1].lAeq : current.lAeq;

          // Spočítat průměr pozadí (logaritmický)
          const background = logAverage(before, after);

          // Korigovat LAeq na pozadí
          const corrected = subtractBackground(current.lAeq, background);

          impulses.push({
            timestamp: current.timestamp,
            lAeq: current.lAeq,
            lAImax: current.lAImax,
            lASmax: current.lASmax,
            difference: difference,
            lAeqBefore: before,
            lAeqAfter: after,
            lAeqBackground: background,
            lAeqCorrected: corrected,
            isHighlyImpulsive: true, // Všechny nalezené impulsy mají rozdíl > 5 dB
            isDaytime: isDaytime(current.timestamp),
          });
        }
      }

      if (impulses.length === 0) {
        alert(`Nebyly nalezeny žádné impulsy!\n\nZ ${validMeasurements.length} měření nevyhovuje žádné kritériu LAImax - LASmax > 5 dB.`);
        return;
      }

      console.log(`Analyzováno ${validMeasurements.length} měření:`);
      console.log(`- Nalezeno ${impulses.length} impulsů (${((impulses.length / validMeasurements.length) * 100).toFixed(1)}%)`);
      console.log(`- Denní doba: ${impulses.filter(i => i.isDaytime).length} impulsů`);
      console.log(`- Noční doba: ${impulses.filter(i => !i.isDaytime).length} impulsů`);

      onDataLoaded(impulses, validMeasurements, file.name);
    } catch (error) {
      console.error('Error parsing file:', error);
      alert('Chyba při načítání souboru.\n\nZkontrolujte:\n1. Formát souboru (Excel/CSV)\n2. Názvy sloupců (LAeq, LAImax, LASmax)\n3. Číselné hodnoty v dB');
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

  const parseSeparateDateAndTime = (dateValue: any, timeValue: any): Date => {
    // Parse date
    let date: Date;
    if (dateValue instanceof Date) {
      date = dateValue;
    } else if (typeof dateValue === 'number') {
      // Excel serial number for date
      date = new Date((dateValue - 25569) * 86400 * 1000);
    } else {
      // Try to parse as string (e.g., "14.3.2024" or "14/3/2024")
      const dateStr = String(dateValue);
      const czechDateMatch = dateStr.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
      if (czechDateMatch) {
        const [, day, month, year] = czechDateMatch;
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        date = new Date(dateStr);
      }
    }

    // Parse time
    let hours = 0, minutes = 0, seconds = 0;
    if (typeof timeValue === 'number') {
      // Excel time is a fraction of a day (e.g., 0.5 = 12:00)
      const totalSeconds = Math.round(timeValue * 86400);
      hours = Math.floor(totalSeconds / 3600);
      minutes = Math.floor((totalSeconds % 3600) / 60);
      seconds = totalSeconds % 60;
    } else {
      // Parse as string (e.g., "10:15:30" or "10:15")
      const timeStr = String(timeValue);
      const timeMatch = timeStr.match(/(\d{1,2}):(\d{2}):?(\d{2})?/);
      if (timeMatch) {
        hours = parseInt(timeMatch[1]);
        minutes = parseInt(timeMatch[2]);
        seconds = parseInt(timeMatch[3] || '0');
      }
    }

    // Combine date and time
    date.setHours(hours, minutes, seconds, 0);
    return date;
  };

  const parseExcelDate = (dateStr: any): Date => {
    if (dateStr instanceof Date) return dateStr;
    if (typeof dateStr === 'number') {
      return new Date((dateStr - 25569) * 86400 * 1000);
    }
    const str = String(dateStr);
    const czechMatch = str.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})\s+(\d{1,2}):(\d{2}):?(\d{2})?/);
    if (czechMatch) {
      const [, day, month, year, hour, minute, second] = czechMatch;
      return new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour),
        parseInt(minute),
        parseInt(second || '0')
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
            Nahrát kontinuální měření
          </h2>
          <p className="text-gray-600 mb-6">
            Excel nebo CSV soubor s 1sekundovými daty (LAeq, LAImax, LASmax)
          </p>

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
                <li><strong>Datum</strong> nebo <strong>date</strong> - Datum měření (DD.MM.YYYY nebo Excel formát)</li>
                <li><strong>Čas</strong> nebo <strong>time</strong> - Čas měření (HH:MM:SS nebo HH:MM nebo Excel formát)</li>
                <li><strong>LAeq</strong> nebo <strong>Laeq</strong> - Ekvivalentní hladina [dB(A)]</li>
                <li><strong>LAImax</strong> nebo <strong>LaIMAX</strong> - Maximum s Impulse charakteristikou [dB(A)]</li>
                <li><strong>LASmax</strong> nebo <strong>LASMAX</strong> - Maximum se Slow charakteristikou [dB(A)]</li>
              </ul>
              <p className="text-xs text-blue-700 mt-2 italic">
                <strong>Poznámka:</strong> Podporovány jsou české i anglické názvy sloupců. Místo oddělených sloupců můžete použít jeden sloupec <strong>"Datum a čas"</strong>.
              </p>

              <p className="text-xs text-blue-700 mt-3 italic">
                <strong>Poznámka:</strong> Modul automaticky identifikuje impulsy (LAImax - LASmax {'>'} 5 dB)
                a pro každý impuls provede korekci LAeq na průměr pozadí 1s před a po impulsu.
              </p>
            </div>

            <div className="mt-4 p-4 bg-white rounded border border-blue-200">
              <p className="text-xs font-mono text-gray-700 mb-2">
                <strong>Příklad:</strong>
              </p>
              <div className="overflow-x-auto">
                <table className="text-xs font-mono w-full">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="text-left py-1 px-2">Datum</th>
                      <th className="text-left py-1 px-2">Čas</th>
                      <th className="text-left py-1 px-2">LAeq</th>
                      <th className="text-left py-1 px-2">LAImax</th>
                      <th className="text-left py-1 px-2">LASmax</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-gray-50">
                      <td className="py-1 px-2">14.3.2024</td>
                      <td className="py-1 px-2">10:14:59</td>
                      <td className="py-1 px-2">45.2</td>
                      <td className="py-1 px-2">52.1</td>
                      <td className="py-1 px-2">48.3</td>
                    </tr>
                    <tr className="bg-red-50">
                      <td className="py-1 px-2">14.3.2024</td>
                      <td className="py-1 px-2">10:15:00</td>
                      <td className="py-1 px-2">98.3</td>
                      <td className="py-1 px-2 font-bold text-red-600">118.5</td>
                      <td className="py-1 px-2">105.2</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="py-1 px-2">14.3.2024</td>
                      <td className="py-1 px-2">10:15:01</td>
                      <td className="py-1 px-2">46.1</td>
                      <td className="py-1 px-2">53.4</td>
                      <td className="py-1 px-2">49.1</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                <span className="bg-red-50 px-1 rounded">Červeně</span> = impuls (LAImax - LASmax = 13.3 dB {'>'} 5 dB)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
