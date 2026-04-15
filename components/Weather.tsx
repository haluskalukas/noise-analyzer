'use client';

import { useState } from 'react';

export interface WeatherData {
  hour: number;
  temperature: number; // °C
  humidity: number; // %
  pressure: number; // hPa
  windSpeed: number; // km/h
  windDirection: number; // stupně
}

interface WeatherProps {
  address?: string;
  countingDate?: string;
  weatherData?: WeatherData[];
  onWeatherDataChange?: (data: WeatherData[]) => void;
}

export default function Weather({
  address = '',
  countingDate = '',
  weatherData = [],
  onWeatherDataChange,
}: WeatherProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pomocná funkce pro převod směru větru na světovou stranu
  const getWindDirection = (degrees: number): string => {
    const directions = ['S', 'SSV', 'SV', 'VSV', 'V', 'VJV', 'JV', 'JJV', 'J', 'JJZ', 'JZ', 'ZJZ', 'Z', 'ZSZ', 'SZ', 'SSZ'];
    const index = Math.round(degrees / 22.5) % 16;
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
    if (!address || !countingDate) {
      setError('Vyplňte adresu měření a datum sčítání');
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
        `&start_date=${countingDate}&end_date=${countingDate}` +
        `&timezone=Europe/Prague`
      );

      const data = await response.json();

      if (!data.hourly) {
        setError('Nepodařilo se načíst meteorologická data');
        setIsLoading(false);
        return;
      }

      // 3. Zpracovat data do naší struktury
      const weatherArray: WeatherData[] = [];
      for (let i = 0; i < 24; i++) {
        weatherArray.push({
          hour: i,
          temperature: Math.round(data.hourly.temperature_2m[i] * 10) / 10,
          humidity: Math.round(data.hourly.relative_humidity_2m[i]),
          pressure: Math.round(data.hourly.surface_pressure[i] * 10) / 10,
          windSpeed: Math.round(data.hourly.wind_speed_10m[i] * 10) / 10,
          windDirection: Math.round(data.hourly.wind_direction_10m[i]),
        });
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

        {/* Informace o datech */}
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>Adresa:</strong> {address || 'Není zadána'}
          </p>
          <p className="text-sm text-gray-700">
            <strong>Datum sčítání:</strong> {countingDate ? new Date(countingDate).toLocaleDateString('cs-CZ') : 'Není zadáno'}
          </p>
        </div>

        {/* Tlačítko pro načtení */}
        <button
          onClick={handleLoadWeather}
          disabled={isLoading || !address || !countingDate}
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
                {weatherData.map((data) => {
                  const currentHour = data.hour.toString().padStart(2, '0');
                  const nextHour = ((data.hour + 1) % 24).toString().padStart(2, '0');
                  return (
                    <tr key={data.hour} className="hover:bg-gray-50">
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
                        {data.windDirection}° ({getWindDirection(data.windDirection)})
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
            <p className="text-sm mt-2">Zadejte adresu a datum sčítání, pak klikněte na tlačítko "Načíst data".</p>
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
