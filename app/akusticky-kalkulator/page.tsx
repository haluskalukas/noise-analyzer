'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LevelOperations } from '@/components/calculator/LevelOperations';
import { DistanceAttenuation } from '@/components/calculator/DistanceAttenuation';
import { ExposureDuration } from '@/components/calculator/ExposureDuration';
import { SoundInsulation } from '@/components/calculator/SoundInsulation';

type CalculatorSection = 'operations' | 'distance' | 'exposure' | 'insulation';

export default function AkustickyKalkulator() {
  const [activeSection, setActiveSection] = useState<CalculatorSection>('operations');

  const sections = [
    {
      id: 'operations' as const,
      name: 'Operace s hladinami',
      icon: '🔢',
      description: 'Součet, odečet a průměr',
      color: 'from-blue-500 to-purple-500',
    },
    {
      id: 'distance' as const,
      name: 'Útlum vzdáleností',
      icon: '📐',
      description: '3 typy výpočtů útlumu',
      color: 'from-indigo-500 to-blue-500',
    },
    {
      id: 'exposure' as const,
      name: 'Délka působení',
      icon: '⏱️',
      description: 'Jeden i více zdrojů',
      color: 'from-emerald-500 to-teal-500',
    },
    {
      id: 'insulation' as const,
      name: 'Neprůzvučnost',
      icon: '🏗️',
      description: 'Složené konstrukce',
      color: 'from-rose-500 to-pink-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                🧮 Akustický kalkulátor
              </h1>
              <p className="mt-2 text-gray-600">
                Kompletní nástroj pro akustické výpočty
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
        {/* Section Selector - Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`relative p-6 rounded-xl transition-all duration-300 text-left ${
                activeSection === section.id
                  ? `bg-gradient-to-br ${section.color} text-white shadow-2xl scale-105 transform`
                  : 'bg-white hover:shadow-lg border-2 border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Icon */}
              <div className="text-5xl mb-3">{section.icon}</div>

              {/* Title */}
              <h3
                className={`text-lg font-bold mb-1 ${
                  activeSection === section.id ? 'text-white' : 'text-gray-900'
                }`}
              >
                {section.name}
              </h3>

              {/* Description */}
              <p
                className={`text-sm ${
                  activeSection === section.id ? 'text-white/90' : 'text-gray-600'
                }`}
              >
                {section.description}
              </p>

              {/* Active Indicator */}
              {activeSection === section.id && (
                <div className="absolute top-4 right-4">
                  <span className="flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Active Section Content */}
        <div className="animate-fadeIn">
          {activeSection === 'operations' && <LevelOperations />}
          {activeSection === 'distance' && <DistanceAttenuation />}
          {activeSection === 'exposure' && <ExposureDuration />}
          {activeSection === 'insulation' && <SoundInsulation />}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 text-center text-sm text-gray-500 border-t border-gray-200 bg-white">
        <p className="mb-2">🧮 Akustický kalkulátor</p>
        <p className="text-xs">
          Všechny výpočty používají správné logaritmické vzorce pro akustické veličiny
        </p>
      </footer>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
