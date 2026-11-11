import * as XLSX from 'xlsx';
import { NoiseData, NoiseDataPoint } from '@/types';
import { calculateStats } from './noiseStats';

/**
 * Parse Excel file with noise data
 * Expected format: columns with Date, Time, Value (dB)
 */
export async function parseExcelFile(file: File): Promise<NoiseData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

        // Parse data points
        const points = parseDataPoints(jsonData);

        if (points.length === 0) {
          throw new Error('Žádná platná data nebyla nalezena');
        }

        // Calculate statistics
        const stats = calculateStats(points);

        const noiseData: NoiseData = {
          filename: file.name,
          date: points[0].datetime,
          points,
          stats,
        };

        resolve(noiseData);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Chyba při čtení souboru'));
    };

    reader.readAsBinaryString(file);
  });
}

function parseDataPoints(jsonData: any[][]): NoiseDataPoint[] {
  const points: NoiseDataPoint[] = [];

  // Skip header row
  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i];

    // Try different column formats
    // Format 1: [Date, Time, Value]
    // Format 2: [DateTime, Value]
    // Format 3: [Date/Time combined, Value]

    let datetime: Date | null = null;
    let value: number | null = null;

    // Try parsing different formats
    if (row.length >= 3) {
      // Format: Date, Time, Value
      const dateStr = row[0];
      const timeStr = row[1];
      value = parseFloat(row[2]);

      datetime = parseDateTime(dateStr, timeStr);
    } else if (row.length >= 2) {
      // Format: DateTime, Value
      datetime = parseDateTime(row[0]);
      value = parseFloat(row[1]);
    }

    if (datetime && !isNaN(value!)) {
      points.push({
        datetime,
        value: value!,
        hour: datetime.getHours(),
        minute: datetime.getMinutes(),
      });
    }
  }

  return points;
}

function parseDateTime(dateStr: any, timeStr?: any): Date | null {
  try {
    if (dateStr instanceof Date) {
      return dateStr;
    }

    // Excel serial date (datum, případně datum + čas v desetinné části)
    if (typeof dateStr === 'number') {
      // Datum počítáme v UTC, aby výsledek neovlivnil posun časového pásma
      // epochy 1899 ani letní čas; pak sestavíme místní datum a čas.
      const daysOffset = Math.floor(dateStr);
      const base = new Date(Date.UTC(1899, 11, 30) + daysOffset * 86400000);
      const y = base.getUTCFullYear();
      const m = base.getUTCMonth();
      const d = base.getUTCDate();

      // Čas: samostatný sloupec, jinak desetinná část data
      let seconds = Math.round((dateStr - daysOffset) * 86400);
      const hasTime = timeStr !== undefined && timeStr !== null && timeStr !== '';
      if (hasTime) {
        if (typeof timeStr === 'number') {
          // Čas jako zlomek dne. Některé exporty (SVAN) ukládají čas po půlnoci
          // jako 1,000… (1. 1. 1900 0:00) – den se bere ze sloupce data,
          // proto jen desetinná část.
          seconds = Math.round((timeStr - Math.floor(timeStr)) * 86400);
        } else if (timeStr instanceof Date) {
          seconds = timeStr.getHours() * 3600 + timeStr.getMinutes() * 60 + timeStr.getSeconds();
        } else if (typeof timeStr === 'string') {
          const timeParts = timeStr.trim().split(':');
          if (timeParts.length >= 2) {
            seconds =
              parseInt(timeParts[0]) * 3600 +
              parseInt(timeParts[1]) * 60 +
              (timeParts[2] ? Math.round(parseFloat(timeParts[2])) : 0);
          }
        }
      }
      seconds = ((seconds % 86400) + 86400) % 86400; // zaokrouhlení na 24:00:00 → 0:00:00

      return new Date(y, m, d, Math.floor(seconds / 3600), Math.floor((seconds % 3600) / 60), seconds % 60);
    }

    // String format
    if (typeof dateStr === 'string') {
      // Try ISO format
      let date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date;
      }

      // Try Czech format: DD.MM.YYYY HH:MM
      const czechMatch = dateStr.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})\s+(\d{1,2}):(\d{2})/);
      if (czechMatch) {
        return new Date(
          parseInt(czechMatch[3]), // year
          parseInt(czechMatch[2]) - 1, // month (0-indexed)
          parseInt(czechMatch[1]), // day
          parseInt(czechMatch[4]), // hour
          parseInt(czechMatch[5])  // minute
        );
      }
    }

    return null;
  } catch {
    return null;
  }
}

