'use client';

import LakesSearchCards from './components/LakesSearchCards';
import { ThemeToggleButton } from './ThemeToggleButton';

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <ThemeToggleButton />
      <h1 className="text-2xl font-bold mb-6">Recherche de Lacs</h1>
      <div className="w-full">
        <LakesSearchCards />
      </div>
    </main>
  );
}
