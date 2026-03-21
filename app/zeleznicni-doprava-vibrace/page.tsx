'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ZeleznicniDopravaVibrace() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🛤️ Železniční doprava - vibrace
              </h1>
              <p className="mt-2 text-gray-600">
                Analýza měření vibrací z průjezdů vlaků
              </p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2"
            >
              ← Zpět na projekty
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <p className="text-gray-600">Modul v přípravě...</p>
        </div>
      </main>
    </div>
  );
}
