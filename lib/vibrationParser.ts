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
          raw: true // Keep raw values (numbers for dates/times)
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

        // No downsampling at parse time - we'll handle it in the chart component
        for (let i = 1; i < rawData.length; i++) {
          const row = rawData[i];

          if (!row || row.length < 62) continue;

          // Parse datetime - XLSX already converted to Date objects with cellDates: true
          let datetime: Date;

          if (row[0] instanceof Date && row[1] instanceof Date) {
            // Combine date from row[0] and time from row[1]
            const dateObj = row[0];
            const timeObj = row[1];

            datetime = new Date(
              dateObj.getFullYear(),
              dateObj.getMonth(),
              dateObj.getDate(),
              timeObj.getHours(),
              timeObj.getMinutes(),
              timeObj.getSeconds(),
              timeObj.getMilliseconds()
            );
          } else {
            // Fallback if not Date objects
            datetime = new Date();
          }

          // Parse only the 50 Hz frequency from Z axis for display
          // Z axis: columns 42-61 (indices 41-60 in row, or 2+40 to 2+59)
          // 50 Hz is at position 17 in the frequency list
          // So column index is: 2 + 40 + 17 = 59
          const freq50HzColumn = 59;
          const freq50HzValue = parseFloat(row[freq50HzColumn]);

          // Parse all 60 frequency values for calculations
          // Columns: C-V (X), W-AP (Y), AQ-BJ (Z) = indices 2-61 in row array
          const frequencies: number[] = [];
          for (let j = 2; j < 62; j++) {
            const value = parseFloat(row[j]);
            frequencies.push(isNaN(value) ? 0 : value);
          }

          // Debug logging pro první řádek
          if (i === 1) {
            console.log('=== DEBUG PARSER - První řádek ===');
            console.log('Čas:', datetime.toLocaleTimeString());
            console.log('Celkem sloupců v řádku:', row.length);
            console.log('Osa X (sloupce C-V, indexy 2-21):');
            console.log('  f=1 Hz (index 2):', row[2]);
            console.log('  f=50 Hz (index 19):', row[19]);
            console.log('Osa Y (sloupce W-AP, indexy 22-41):');
            console.log('  f=1 Hz (index 22):', row[22]);
            console.log('  f=50 Hz (index 39):', row[39]);
            console.log('Osa Z (sloupce AQ-BJ, indexy 42-61):');
            console.log('  f=1 Hz (index 42):', row[42]);
            console.log('  f=50 Hz (index 59):', row[59]);
            console.log('');
            console.log('Array frequencies (po parsování):');
            console.log('  Index 0 (osa X, f=1 Hz):', frequencies[0]);
            console.log('  Index 17 (osa X, f=50 Hz):', frequencies[17]);
            console.log('  Index 20 (osa Y, f=1 Hz):', frequencies[20]);
            console.log('  Index 37 (osa Y, f=50 Hz):', frequencies[37]);
            console.log('  Index 40 (osa Z, f=1 Hz):', frequencies[40]);
            console.log('  Index 57 (osa Z, f=50 Hz):', frequencies[57]);
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

        console.log(`Vibration data loaded: ${points.length} points`);

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
