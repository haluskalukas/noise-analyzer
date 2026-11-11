'use client';

import { useState } from 'react';

export interface WeatherData {
  hour: number;
  datetime?: string; // začátek hodiny, místní čas "YYYY-MM-DDTHH:00" (starší projekty ho nemají)
  temperature: number; // °C
  humidity: number; // %
  pressure: number; // hPa
  windSpeed: number; // km/h
  windDirection: number; // stupně
}

interface WeatherProps {
  weatherData?: WeatherData[];
  onWeatherDataChange?: (data: WeatherData[]) => void;
  measurementStart?: Date; // první bod nahraného měření – výchozí „od“
  measurementEnd?: Date; // poslední bod nahraného měření – výchozí „do“
}

const pad = (n: number) => n.toString().padStart(2, '0');

// Date -> "YYYY-MM-DDTHH:MM" v místním čase (formát pro <input type="datetime-local">)
const toLocalInput = (d?: Date): string => {
  if (!d || isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// "YYYY-MM-DDTHH:MM" -> "D. M. YYYY"
export const formatWeatherDate = (datetime: string): string => {
  const [y, m, d] = datetime.slice(0, 10).split('-').map(Number);
  return `${d}. ${m}. ${y}`;
};

export default function Weather({
  weatherData = [],
  onWeatherDataChange,
  measurementStart,
  measurementEnd,
}: WeatherProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState<string>('');
  // Období měření od–do (datum a čas), výchozí hodnoty z nahraného měření
  const [periodFrom, setPeriodFrom] = useState<string>(() => toLocalInput(measurementStart));
  const [periodTo, setPeriodTo] = useState<string>(() => toLocalInput(measurementEnd));

  // Pomocná funkce pro převod směru větru na světovou stranu (pouze 8 hlavních směrů)
  const getWindDirection = (degrees: number): string => {
    const directions = ['S', 'SV', 'V', 'JV', 'J', 'JZ', 'Z', 'SZ'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  // Geocoding - převod adresy na GPS souřadnice
  const getCoordinates = async (address: string): Promise<{ lat: number; lon: number } | null> => {
    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(address)}&count=1&language=cs&format=json`
      );
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        return {
          lat: data.results[0].latitude,
          lon: data.results[0].longitude,
        };
      }
      return null;
    } catch (err) {
      console.error('Geocoding error:', err);
      return null;
    }
  };

  // Načtení meteorologických dat
  const handleLoadWeather = async () => {
    if (!address || !periodFrom || !periodTo) {
      setError('Vyplňte adresu měření a období od–do');
      return;
    }
    if (periodTo <= periodFrom) {
      setError('Konec období musí být po jeho začátku');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Získat GPS souřadnice
      const coords = await getCoordinates(address);
      if (!coords) {
        setError('Nepodařilo se najít GPS souřadnice pro zadanou adresu');
        setIsLoading(false);
        return;
      }

      // 2. Načíst meteorologická data
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?` +
        `latitude=${coords.lat}&longitude=${coords.lon}` +
        `&hourly=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m` +
        `&start_date=${periodFrom.slice(0, 10)}&end_date=${periodTo.slice(0, 10)}` +
        `&timezone=Europe/Prague`
      );

      const data = await response.json();

      if (!data.hourly || !Array.isArray(data.hourly.time)) {
        setError(`Nepodařilo se načíst meteorologická data${data.reason ? ` (${data.reason})` : ''}`);
        setIsLoading(false);
        return;
      }

      // 3. Vybrat hodiny, které zasahují do období od–do, a přiřadit je podle data a času.
      //    Hodina se bere, když začíná před „do“ a končí po „od“
      //    (např. měření od 17:13 zahrne hodinu 17:00–18:00).
      const fromHour = periodFrom.slice(0, 13) + ':00'; // začátek hodiny, ve které měření začalo
      const weatherArray: WeatherData[] = [];
      data.hourly.time.forEach((time: string, i: number) => {
        if (time < fromHour || time >= periodTo) return;
        weatherArray.push({
          hour: Number(time.slice(11, 13)),
          datetime: time,
          temperature: Math.round(data.hourly.temperature_2m[i] * 10) / 10,
          humidity: Math.round(data.hourly.relative_humidity_2m[i]),
          pressure: Math.round(data.hourly.surface_pressure[i] * 10) / 10,
          windSpeed: Math.round(data.hourly.wind_speed_10m[i] * 10) / 10,
          windDirection: Math.round(data.hourly.wind_direction_10m[i]),
        });
      });

      if (weatherArray.length === 0) {
        setError('Pro zadané období nejsou k dispozici žádná data');
        setIsLoading(false);
        return;
      }

      // 4. Uložit data
      if (onWeatherDataChange) {
        onWeatherDataChange(weatherArray);
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Weather API error:', err);
      setError('Chyba při načítání meteorologických dat');
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Meteorologické podmínky</h2>

        {/* Vstupní pole pro adresu a datum */}
        <div className="mb-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adresa místa
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Zadej adresu nebo název místa"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Měření od (datum a čas)
              </label>
              <input
                type="datetime-local"
                value={periodFrom}
                onChange={(e) => setPeriodFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Měření do (datum a čas)
              </label>
              <input
                type="datetime-local"
                value={periodTo}
                onChange={(e) => setPeriodTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          {measurementStart && measurementEnd && (
            <p className="text-xs text-gray-500">
              Předvyplněno podle nahraného měření ({toLocalInput(measurementStart).replace('T', ' ')} –{' '}
              {toLocalInput(measurementEnd).replace('T', ' ')}). Meteo se přiřadí ke skutečnému datu a hodině.
            </p>
          )}
        </div>

        {/* Tlačítko pro načtení */}
        <button
          onClick={handleLoadWeather}
          disabled={isLoading || !address || !periodFrom || !periodTo}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed mb-4"
        >
          {isLoading ? 'Načítám...' : 'Načíst data z Open-Meteo'}
        </button>

        {/* Chybová hláška */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Tabulka s daty */}
        {weatherData.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Datum
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Čas
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teplota [°C]
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vlhkost [%]
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tlak [hPa]
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rychlost větru [km/h]
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Směr větru
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {weatherData.map((data, i) => {
                  const currentHour = data.hour.toString().padStart(2, '0');
                  const nextHour = ((data.hour + 1) % 24).toString().padStart(2, '0');
                  return (
                    <tr key={data.datetime ?? i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {data.datetime ? formatWeatherDate(data.datetime) : '–'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {currentHour}:00 - {nextHour}:00
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {data.temperature.toFixed(1).replace('.', ',')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {data.humidity}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {data.pressure.toFixed(1).replace('.', ',')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {data.windSpeed.toFixed(1).replace('.', ',')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {getWindDirection(data.windDirection)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Prázdný stav */}
        {weatherData.length === 0 && !error && (
          <div className="text-center py-8 text-gray-500">
            <p>Zatím nejsou načtena žádná meteorologická data.</p>
            <p className="text-sm mt-2">Zadejte adresu a období měření od–do, pak klikněte na tlačítko &quot;Načíst data&quot;.</p>
          </div>
        )}

        {/* Poznámka o zdroji dat */}
        {weatherData.length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">
              Data poskytuje{' '}
              <a
                href="https://open-meteo.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Open-Meteo.com
              </a>{' '}
              (CC BY 4.0)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
