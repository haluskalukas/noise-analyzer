'use client';

import { useState } from 'react';

interface SummaryProps {
  measuredDayAvg: number; // naměřený průměr den ze statistik
  measuredNightAvg: number; // naměřený průměr noc ze statistik
  rpdiCorrectionDay: number; // korekce na RPDI den (rozdíl z kalkulátoru)
  rpdiCorrectionNight: number; // korekce na RPDI noc (rozdíl z kalkulátoru)
  address?: string;
  onAddressChange?: (address: string) => void;
  facadeReflection?: boolean;
  onFacadeReflectionChange?: (value: boolean) => void;
  uncertainty?: number;
  onUncertaintyChange?: (value: number) => void;
  roadBefore2001?: boolean;
  onRoadBefore2001Change?: (value: boolean) => void;
}

// Helper funkce pro formátování čísel s českou desetinnou čárkou
function formatCzechNumber(num: number, decimals: number = 1): string {
  return num.toFixed(decimals).replace('.', ',');
}

export default function Summary({
  measuredDayAvg,
  measuredNightAvg,
  rpdiCorrectionDay,
  rpdiCorrectionNight,
  address: externalAddress,
  onAddressChange,
  facadeReflection: externalFacadeReflection,
  onFacadeReflectionChange,
  uncertainty: externalUncertainty,
  onUncertaintyChange,
  roadBefore2001: externalRoadBefore2001,
  onRoadBefore2001Change,
}: SummaryProps) {
  // Použij external state pokud je poskytnut, jinak internal state
  const [internalAddress, setInternalAddress] = useState<string>('');
  const [internalFacadeReflection, setInternalFacadeReflection] = useState<boolean>(false);
  const [internalUncertainty, setInternalUncertainty] = useState<number>(1.8);
  const [internalRoadBefore2001, setInternalRoadBefore2001] = useState<boolean>(false);

  const address = externalAddress ?? internalAddress;
  const facadeReflection = externalFacadeReflection ?? internalFacadeReflection;
  const uncertainty = externalUncertainty ?? internalUncertainty;
  const roadBefore2001 = externalRoadBefore2001 ?? internalRoadBefore2001;

  const setAddress = (value: string) => {
    if (onAddressChange) {
      onAddressChange(value);
    } else {
      setInternalAddress(value);
    }
  };

  const setFacadeReflection = (value: boolean) => {
    if (onFacadeReflectionChange) {
      onFacadeReflectionChange(value);
    } else {
      setInternalFacadeReflection(value);
    }
  };

  const setUncertainty = (value: number) => {
    if (onUncertaintyChange) {
      onUncertaintyChange(value);
    } else {
      setInternalUncertainty(value);
    }
  };

  const setRoadBefore2001 = (value: boolean) => {
    if (onRoadBefore2001Change) {
      onRoadBefore2001Change(value);
    } else {
      setInternalRoadBefore2001(value);
    }
  };

  // Korekce na odraz
  const reflectionCorrection = facadeReflection ? -2 : 0;

  // Hygienické limity
  const limitDay = roadBefore2001 ? 68 : 60;
  const limitNight = roadBefore2001 ? 58 : 50;

  // Výsledné hodnoty
  // Výsledná = Naměřená + Korekce odraz + Korekce RPDI - Nejistota
  const finalDay =
    measuredDayAvg > 0
      ? Math.round((measuredDayAvg + reflectionCorrection + rpdiCorrectionDay - uncertainty) * 10) / 10
      : null;

  const finalNight =
    measuredNightAvg > 0
      ? Math.round((measuredNightAvg + reflectionCorrection + rpdiCorrectionNight - uncertainty) * 10) / 10
      : null;

  // Vyhodnocení limitu
  const exceedsLimitDay = finalDay !== null && finalDay > limitDay;
  const exceedsLimitNight = finalNight !== null && finalNight > limitNight;

  return (
    <div className="space-y-6">
      {/* Nadpis */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">📋 Souhrn měření</h2>
        <p className="text-gray-600">Finální vyhodnocení hluku s korekcemi a porovnání s hygienickými limity</p>
      </div>

      {/* Parametry */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Parametry vyhodnocení</h3>

        <div className="space-y-4">
          {/* Adresa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adresa měření</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Např. Hlavní 123, Praha"
            />
          </div>

          {/* Odraz od fasády */}
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Odraz od fasády:</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={facadeReflection === true}
                  onChange={() => setFacadeReflection(true)}
                  className="mr-2"
                />
                <span className="text-sm">ANO (korekce -2 dB)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={facadeReflection === false}
                  onChange={() => setFacadeReflection(false)}
                  className="mr-2"
                />
                <span className="text-sm">NE (korekce 0 dB)</span>
              </label>
            </div>
          </div>

          {/* Nejistota */}
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Nejistota měření:</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={uncertainty === 1.8}
                  onChange={() => setUncertainty(1.8)}
                  className="mr-2"
                />
                <span className="text-sm">1,8 dB</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={uncertainty === 1.7}
                  onChange={() => setUncertainty(1.7)}
                  className="mr-2"
                />
                <span className="text-sm">1,7 dB</span>
              </label>
            </div>
          </div>

          {/* Rok zprovoznění */}
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Byla silnice zprovozněna před rokem 2001?</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={roadBefore2001 === true}
                  onChange={() => setRoadBefore2001(true)}
                  className="mr-2"
                />
                <span className="text-sm">ANO (limit 68/58 dB)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={roadBefore2001 === false}
                  onChange={() => setRoadBefore2001(false)}
                  className="mr-2"
                />
                <span className="text-sm">NE (limit 60/50 dB)</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Tabulka výsledků */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Výsledky vyhodnocení</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Adresa
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Naměřená hodnota den [dB(A)]
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Naměřená hodnota noc [dB(A)]
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Korekce odraz [dB]
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Korekce RPDI den [dB]
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Korekce RPDI noc [dB]
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Nejistota [dB]
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider bg-blue-50">
                  Výsledná hodnota den [dB(A)]
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider bg-blue-50">
                  Výsledná hodnota noc [dB(A)]
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Limit den [dB(A)]
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Limit noc [dB(A)]
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                {/* Adresa */}
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {address || '—'}
                </td>

                {/* Naměřená den */}
                <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                  {measuredDayAvg > 0 ? formatCzechNumber(measuredDayAvg) : '—'}
                </td>

                {/* Naměřená noc */}
                <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                  {measuredNightAvg > 0 ? formatCzechNumber(measuredNightAvg) : '—'}
                </td>

                {/* Korekce odraz */}
                <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                  {formatCzechNumber(reflectionCorrection)}
                </td>

                {/* Korekce RPDI den */}
                <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                  <span className={rpdiCorrectionDay > 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                    {rpdiCorrectionDay > 0 ? '+' : ''}
                    {formatCzechNumber(rpdiCorrectionDay)}
                  </span>
                </td>

                {/* Korekce RPDI noc */}
                <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                  <span className={rpdiCorrectionNight > 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                    {rpdiCorrectionNight > 0 ? '+' : ''}
                    {formatCzechNumber(rpdiCorrectionNight)}
                  </span>
                </td>

                {/* Nejistota */}
                <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                  {formatCzechNumber(uncertainty)}
                </td>

                {/* Výsledná den */}
                <td className={`px-4 py-4 whitespace-nowrap text-sm text-center font-bold ${exceedsLimitDay ? 'bg-red-100 text-red-900' : 'bg-green-100 text-green-900'}`}>
                  {finalDay !== null ? formatCzechNumber(finalDay) : '—'}
                </td>

                {/* Výsledná noc */}
                <td className={`px-4 py-4 whitespace-nowrap text-sm text-center font-bold ${exceedsLimitNight ? 'bg-red-100 text-red-900' : 'bg-green-100 text-green-900'}`}>
                  {finalNight !== null ? formatCzechNumber(finalNight) : '—'}
                </td>

                {/* Limit den */}
                <td className="px-4 py-4 whitespace-nowrap text-sm text-center font-semibold text-gray-900">
                  {formatCzechNumber(limitDay)}
                </td>

                {/* Limit noc */}
                <td className="px-4 py-4 whitespace-nowrap text-sm text-center font-semibold text-gray-900">
                  {formatCzechNumber(limitNight)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Informace */}
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">ℹ️ Vysvětlivky</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p>
            <strong>Výpočet výsledné hodnoty:</strong> Naměřená hodnota + Korekce na odraz + Korekce na RPDI - Nejistota
          </p>
          <p>
            <strong>Hygienické limity:</strong> Podle zákona č. 258/2000 Sb. o ochraně veřejného zdraví
          </p>
          <p>
            <strong>Silnice zprovozněná před rokem 2001:</strong> Den 68 dB(A), Noc 58 dB(A)
          </p>
          <p>
            <strong>Silnice zprovozněná po roce 2001:</strong> Den 60 dB(A), Noc 50 dB(A)
          </p>
          <p>
            <strong>Prokazatelné překročení:</strong> Limit je překročen, pokud výsledná hodnota je vyšší než hygienický limit
          </p>
        </div>
      </div>
    </div>
  );
}
