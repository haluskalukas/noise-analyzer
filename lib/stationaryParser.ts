import * as XLSX from 'xlsx';
import { StationaryData, StationaryDataPoint, STATIONARY_FREQUENCY_LIST } from '@/types/stationary';

export function parseStationaryExcel(file: File): Promise<StationaryData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (rows.length < 2) {
          throw new Error('Excel soubor neobsahuje dostatek dat');
        }

        // Skip header row
        const dataRows = rows.slice(1);

        const points: StationaryDataPoint[] = [];
        let fileDate: Date | null = null;

        for (const row of dataRows) {
          if (!row || row.length < 34) continue; // Need date, time, laeq + 31 frequencies

          // Parse date (Excel serial date)
          let datetime: Date;
          if (typeof row[0] === 'number') {
            // Excel date serial number
            const excelDate = XLSX.SSF.parse_date_code(row[0]);
            datetime = new Date(excelDate.y, excelDate.m - 1, excelDate.d);
          } else if (typeof row[0] === 'string') {
            // String date format (e.g., "14.3.2026")
            const parts = row[0].split('.');
            if (parts.length === 3) {
              datetime = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
            } else {
              datetime = new Date(row[0]);
            }
          } else {
            continue;
          }

          if (!fileDate) {
            fileDate = new Date(datetime);
          }

          // Parse time (Excel serial time or string)
          let hours = 0;
          let minutes = 0;
          let seconds = 0;

          if (typeof row[1] === 'number') {
            // Excel time serial (fraction of day)
            const totalSeconds = row[1] * 86400;
            hours = Math.floor(totalSeconds / 3600);
            minutes = Math.floor((totalSeconds % 3600) / 60);
            seconds = Math.floor(totalSeconds % 60);
          } else if (typeof row[1] === 'string') {
            const timeParts = row[1].split(':');
            if (timeParts.length >= 2) {
              hours = parseInt(timeParts[0]);
              minutes = parseInt(timeParts[1]);
              if (timeParts.length === 3) {
                seconds = parseInt(timeParts[2]);
              }
            }
          }

          datetime.setHours(hours, minutes, seconds, 0);

          // Parse LAeq
          const laeq = parseFloat(row[2]);
          if (isNaN(laeq)) continue;

          // Parse frequencies (31 values starting from column 3)
          const frequencies: number[] = [];
          for (let i = 3; i < 34; i++) {
            const freq = parseFloat(row[i]);
            frequencies.push(isNaN(freq) ? 0 : freq);
          }

          if (frequencies.length !== 31) continue;

          points.push({
            datetime,
            laeq,
            frequencies,
          });
        }

        if (points.length === 0) {
          throw new Error('Nebyly nalezeny žádné platné datové body');
        }

        resolve({
          filename: file.name,
          date: fileDate || new Date(),
          points,
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Chyba při čtení souboru'));
    reader.readAsBinaryString(file);
  });
}
