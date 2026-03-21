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
