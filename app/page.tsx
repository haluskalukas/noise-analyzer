'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Home() {
  const [savedStates, setSavedStates] = useState<Record<string, boolean>>({});

  // Check for saved states in localStorage
  useEffect(() => {
    const states: Record<string, boolean> = {};
    states['automobilova-doprava'] = !!localStorage.getItem('automobilova-doprava-state');
    states['zeleznicni-doprava-hluk'] = !!localStorage.getItem('zeleznicni-doprava-hluk-state');
    states['impulzni-hluk'] = !!localStorage.getItem('impulzni-hluk-state');
    // Note: vibrace module doesn't use localStorage (files too large)
    setSavedStates(states);
  }, []);

  const projects = [
    {
      id: 'automobilova-doprava',
      title: 'Automobilová doprava',
      description: 'Analýza hluku z automobilové dopravy',
      icon: '🚗',
      color: 'from-blue-500 to-blue-600',
      available: true,
    },
    {
      id: 'zeleznicni-doprava-hluk',
      title: 'Železniční doprava - hluk',
      description: 'Analýza hluku ze železniční dopravy',
      icon: '🚂',
      color: 'from-green-500 to-green-600',
      available: true,
    },
    {
      id: 'zeleznicni-doprava-vibrace',
      title: 'Železniční doprava - vibrace',
      description: 'Analýza vibrací ze železniční dopravy',
      icon: '🛤️',
      color: 'from-emerald-500 to-emerald-600',
      available: true,
    },
    {
      id: 'stacionarni-zdroje',
      title: 'Stacionární zdroje hluku',
      description: 'Analýza hluku ze stacionárních zdrojů',
      icon: '🏭',
      color: 'from-orange-500 to-orange-600',
      available: true,
    },
    {
      id: 'impulzni-hluk',
      title: 'Impulzní hluk',
      description: 'Analýza impulzních událostí (výbuchy, údery, výstřely)',
      icon: '💥',
      color: 'from-red-500 to-red-600',
      available: true,
    },
    {
      id: 'nepruzvucnost',
      title: 'Neprůzvučnost',
      description: 'Vyhodnocení vzduchové neprůzvučnosti podle ČSN EN ISO 16283-1',
      icon: '🔇',
      color: 'from-cyan-500 to-cyan-600',
      available: true,
    },
    {
      id: 'pracovni-prostredi-hluk',
      title: 'Pracovní prostředí - hluk',
      description: 'Měření a analýza hluku v pracovním prostředí',
      icon: '👷',
      color: 'from-purple-500 to-purple-600',
      available: false,
    },
    {
      id: 'pracovni-prostredi-vibrace',
      title: 'Pracovní prostředí - vibrace',
      description: 'Měření a analýza vibrací v pracovním prostředí',
      icon: '⚡',
      color: 'from-pink-500 to-pink-600',
      available: false,
    },
    {
      id: 'akusticky-kalkulator',
      title: 'Akustický kalkulátor',
      description: 'Kalkulace akustických veličin a převody jednotek',
      icon: '🧮',
      color: 'from-indigo-500 to-indigo-600',
      available: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              🔊 Akustické výpočty
            </h1>
            <p className="text-lg text-gray-600">
              Profesionální nástroje pro analýzu hluku a vibrací
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} hasSavedState={savedStates[project.id]} />
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 text-center text-sm text-gray-500">
        <p>Akustické výpočty • Vytvořeno s Next.js a TypeScript</p>
      </footer>
    </div>
  );
}

function ProjectCard({ project, hasSavedState }: { project: any; hasSavedState?: boolean }) {
  const content = (
    <div
      className={`relative h-full p-6 rounded-xl shadow-lg transition-all duration-300 ${
        project.available
          ? 'hover:shadow-2xl hover:scale-105 cursor-pointer bg-gradient-to-br ' + project.color
          : 'bg-gray-300 cursor-not-allowed opacity-60'
      }`}
    >
      {/* Icon */}
      <div className="text-6xl mb-4">{project.icon}</div>

      {/* Title */}
      <h3
        className={`text-xl font-bold mb-2 ${
          project.available ? 'text-white' : 'text-gray-600'
        }`}
      >
        {project.title}
      </h3>

      {/* Description */}
      <p
        className={`text-sm ${
          project.available ? 'text-white/90' : 'text-gray-500'
        }`}
      >
        {project.description}
      </p>

      {/* Saved State Badge */}
      {project.available && hasSavedState && (
        <div className="absolute top-4 right-4">
          <span className="bg-yellow-400 text-yellow-900 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
            💾 Uloženo
          </span>
        </div>
      )}

      {/* Status Badge */}
      {!project.available && (
        <div className="absolute top-4 right-4">
          <span className="bg-gray-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
            Připravujeme
          </span>
        </div>
      )}

      {/* Arrow Icon for available projects */}
      {project.available && (
        <div className="absolute bottom-6 right-6">
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </div>
      )}
    </div>
  );

  if (project.available) {
    return <Link href={`/${project.id}`}>{content}</Link>;
  }

  return content;
}
