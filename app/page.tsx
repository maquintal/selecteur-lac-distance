'use client';

// import LakesSearchCards from './components/LakesSearchCards';
import LakesSearchCards from './fe-convex/page';
import { ThemeToggleButton } from './ThemeToggleButton';

export default function Home() {
  return (
    <main className="min-h-screen px-4 py-6 sm:px-8 sm:py-8">
      <div className="max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl sm:text-2xl font-bold">Recherche de Lacs</h1>
          <ThemeToggleButton />
        </div>

        <div className="w-full">
          <LakesSearchCards />
        </div>
      </div>
    </main>
  );
}
