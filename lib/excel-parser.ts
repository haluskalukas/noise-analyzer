import * as XLSX from 'xlsx';
import { NoiseData, NoiseDataPoint, NoiseStats, HourlyAvg } from '@/types';

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

    // Excel serial date
    if (typeof dateStr === 'number') {
      // Convert Excel serial date to JavaScript Date
      // Excel dates start from 1900-01-01, but there's a bug where 1900 is treated as a leap year
      const excelEpoch = new Date(1899, 11, 30);
      const daysOffset = Math.floor(dateStr);
      const timeOffset = dateStr - daysOffset;

      let datetime = new Date(excelEpoch.getTime() + daysOffset * 86400000);

      // If time is provided separately
      if (timeStr) {
        if (typeof timeStr === 'number') {
          // Time as fraction of day
          const hours = Math.floor(timeStr * 24);
          const minutes = Math.floor((timeStr * 24 - hours) * 60);
          const seconds = Math.floor(((timeStr * 24 - hours) * 60 - minutes) * 60);
          datetime.setHours(hours, minutes, seconds);
        } else if (typeof timeStr === 'string') {
          const timeParts = timeStr.split(':');
          if (timeParts.length >= 2) {
            datetime.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]));
          }
        }
      } else if (timeOffset > 0) {
        // Time is in the decimal part of the date number
        const hours = Math.floor(timeOffset * 24);
        const minutes = Math.floor((timeOffset * 24 - hours) * 60);
        const seconds = Math.floor(((timeOffset * 24 - hours) * 60 - minutes) * 60);
        datetime.setHours(hours, minutes, seconds);
      }

      return datetime;
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

/**
 * Calculate logarithmic average for decibels
 * Formula: Leq = 10 * log10(1/n * sum(10^(Li/10)))
 */
function calculateLogAverage(values: number[]): number {
  if (values.length === 0) return 0;

  const sumOfPowers = values.reduce((sum, db) => sum + Math.pow(10, db / 10), 0);
  const average = sumOfPowers / values.length;
  return 10 * Math.log10(average);
}

/**
 * Calculate percentile from sorted array
 * IMPORTANT: In acoustics, percentiles are reversed!
 * L5 = 5% of time noise is HIGHER (95th percentile of sorted values)
 * L95 = 95% of time noise is HIGHER (5th percentile of sorted values)
 */
function getAcousticPercentile(sortedValues: number[], acousticPercentile: number): number {
  // Reverse the percentile for acoustic notation
  const statisticalPercentile = 1 - (acousticPercentile / 100);
  const index = Math.floor(sortedValues.length * statisticalPercentile);
  return sortedValues[Math.min(index, sortedValues.length - 1)];
}

function calculateStats(points: NoiseDataPoint[]): NoiseStats {
  const values = points.map(p => p.value).sort((a, b) => a - b);

  // Basic stats
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = calculateLogAverage(points.map(p => p.value)); // Logarithmic average!
  const median = values[Math.floor(values.length / 2)];
  const p10 = getAcousticPercentile(values, 10); // L10 = 10% času je hluk vyšší
  const p90 = getAcousticPercentile(values, 90); // L90 = 90% času je hluk vyšší

  // Day/Night averages (6:00-22:00 = day, 22:00-6:00 = night)
  // IMPORTANT: Use logarithmic averaging for decibels!
  const dayPoints = points.filter(p => p.hour >= 6 && p.hour < 22);
  const nightPoints = points.filter(p => p.hour < 6 || p.hour >= 22);

  const dayAvg = dayPoints.length > 0
    ? calculateLogAverage(dayPoints.map(p => p.value))
    : 0;

  const nightAvg = nightPoints.length > 0
    ? calculateLogAverage(nightPoints.map(p => p.value))
    : 0;

  // Hourly averages with percentiles
  const hourlyAvgs: HourlyAvg[] = [];
  for (let hour = 0; hour < 24; hour++) {
    const hourPoints = points.filter(p => p.hour === hour);

    if (hourPoints.length > 0) {
      const hourValues = hourPoints.map(p => p.value).sort((a, b) => a - b);

      hourlyAvgs.push({
        hour,
        avg: calculateLogAverage(hourPoints.map(p => p.value)), // Logarithmic!
        min: Math.min(...hourValues),
        max: Math.max(...hourValues),
        count: hourPoints.length,
        // Acoustic percentiles (reversed!)
        p5: getAcousticPercentile(hourValues, 5),   // L5 = 5% času je hluk VYŠŠÍ
        p10: getAcousticPercentile(hourValues, 10), // L10 = 10% času je hluk VYŠŠÍ
        p90: getAcousticPercentile(hourValues, 90), // L90 = 90% času je hluk VYŠŠÍ
        p95: getAcousticPercentile(hourValues, 95), // L95 = 95% času je hluk VYŠŠÍ
      });
    }
  }

  return {
    min,
    max,
    avg,
    median,
    p10,
    p90,
    dayAvg,
    nightAvg,
    hourlyAvgs,
  };
}
