'use client';

import LakesTable from './components/LakesTable';

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-6">Liste des Lacs</h1>
      <div className="w-full h-[600px]">
        <LakesTable />
      </div>
    </main>
  );
}
