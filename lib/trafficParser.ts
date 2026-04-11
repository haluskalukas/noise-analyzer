import * as XLSX from 'xlsx';
import { HourlyTrafficCount } from '@/types/traffic';

/**
 * Parse Excel file with traffic counting data
 * Expected format: [Hodina, OA, LN, N, A, M, K]
 */
export async function parseTrafficExcel(file: File): Promise<HourlyTrafficCount[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        // Skip header row
        const dataRows = jsonData.slice(1).filter(row => row.length > 0);

        const hourlyCounts: HourlyTrafficCount[] = [];

        for (const row of dataRows) {
          const hour = parseInt(String(row[0]));

          // Validate hour
          if (isNaN(hour) || hour < 0 || hour > 23) continue;

          hourlyCounts.push({
            hour,
            OA: parseInt(String(row[1] || 0)) || 0,
            LN: parseInt(String(row[2] || 0)) || 0,
            N: parseInt(String(row[3] || 0)) || 0,
            A: parseInt(String(row[4] || 0)) || 0,
            M: parseInt(String(row[5] || 0)) || 0,
            K: parseInt(String(row[6] || 0)) || 0,
          });
        }

        // Sort by hour
        hourlyCounts.sort((a, b) => a.hour - b.hour);

        // Fill missing hours with zeros
        const completeData: HourlyTrafficCount[] = [];
        for (let hour = 0; hour < 24; hour++) {
          const existing = hourlyCounts.find(h => h.hour === hour);
          completeData.push(existing || {
            hour,
            OA: 0,
            LN: 0,
            N: 0,
            A: 0,
            M: 0,
            K: 0,
          });
        }

        resolve(completeData);
      } catch (error) {
        reject(new Error('Chyba při parsování Excel souboru: ' + (error as Error).message));
      }
    };

    reader.onerror = () => reject(new Error('Chyba při čtení souboru'));
    reader.readAsArrayBuffer(file);
  });
}
