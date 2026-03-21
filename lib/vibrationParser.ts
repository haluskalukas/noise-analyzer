import * as XLSX from 'xlsx';
import { VibrationData, VibrationDataPoint, FREQUENCY_LIST } from '@/types/vibration';

export function parseVibrationExcel(file: File): Promise<VibrationData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error('Nepodařilo se načíst soubor'));
          return;
        }

        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to array of arrays
        const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: null,
          raw: false
        });

        if (rawData.length < 2) {
          reject(new Error('Soubor neobsahuje dostatek dat'));
          return;
        }

        // Skip header row (index 0), start from data row (index 1)
        const points: VibrationDataPoint[] = [];

        // Get date from first data row
        const firstRow = rawData[1];
        const excelDate = typeof firstRow[0] === 'number' ? firstRow[0] : 45923;
        const baseDate = XLSX.SSF.parse_date_code(excelDate);
        const measurementDate = new Date(baseDate.y, baseDate.m - 1, baseDate.d);

        // Downsample large files to prevent memory issues
        const MAX_POINTS = 10000;
        const step = Math.max(1, Math.ceil((rawData.length - 1) / MAX_POINTS));

        for (let i = 1; i < rawData.length; i += step) {
          const row = rawData[i];

          if (!row || row.length < 62) continue;

          // Parse time
          const excelSerialDate = typeof row[0] === 'number' ? row[0] : 0;
          const excelSerialTime = typeof row[1] === 'number' ? row[1] : 0;

          const dateInfo = XLSX.SSF.parse_date_code(excelSerialDate);
          const timeInDays = excelSerialTime;
          const timeInSeconds = timeInDays * 24 * 60 * 60;

          const hours = Math.floor(timeInSeconds / 3600);
          const minutes = Math.floor((timeInSeconds % 3600) / 60);
          const seconds = Math.floor(timeInSeconds % 60);
          const milliseconds = Math.floor((timeInSeconds % 1) * 1000);

          const datetime = new Date(
            dateInfo.y,
            dateInfo.m - 1,
            dateInfo.d,
            hours,
            minutes,
            seconds,
            milliseconds
          );

          // Parse frequency values (columns 2-61 = 60 values)
          const frequencies: number[] = [];
          for (let j = 2; j < 62; j++) {
            const value = parseFloat(row[j]);
            frequencies.push(isNaN(value) ? 0 : value);
          }

          points.push({
            datetime,
            no: i,
            frequencies,
          });
        }

        if (points.length === 0) {
          reject(new Error('Nepodařilo se načíst žádná data'));
          return;
        }

        // Log downsampling info if applied
        const totalRows = rawData.length - 1;
        if (step > 1) {
          console.log(`Vibration data downsampled: ${totalRows} rows → ${points.length} points (every ${step}. row)`);
        }

        resolve({
          filename: file.name,
          date: measurementDate,
          points,
          frequencyList: FREQUENCY_LIST,
        });
      } catch (error) {
        console.error('Error parsing vibration Excel:', error);
        reject(new Error('Chyba při parsování souboru: ' + (error as Error).message));
      }
    };

    reader.onerror = () => {
      reject(new Error('Chyba při čtení souboru'));
    };

    reader.readAsBinaryString(file);
  });
}
