'use client';

import Link from 'next/link';

export default function ZeleznicniDopravaHluk() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <div className="bg-white rounded-xl shadow-lg p-12">
          <div className="text-8xl mb-6">🚂</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Železniční doprava - hluk
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Tento modul je momentálně ve vývoji a bude brzy k dispozici.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            ← Zpět na projekty
          </Link>
        </div>
      </div>
    </div>
  );
}
