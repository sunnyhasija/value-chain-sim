'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { GameCreator } from '@/components/instructor/GameCreator';
import Link from 'next/link';

export default function InstructorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/instructor/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">
            Instructor Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Welcome, {session.user?.name}
            </span>
            <Link
              href="/api/auth/signout"
              className="text-sm text-red-600 hover:text-red-800"
            >
              Sign Out
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Value Chain Investment Simulation
          </h2>
          <p className="text-gray-600">
            Create a new game session to generate team codes and manage the simulation.
          </p>
        </div>

        <GameCreator />

        {/* Instructions */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Start Guide
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Click &quot;Create Game&quot; to generate a new session with team codes</li>
            <li>Distribute the unique team codes to each student team</li>
            <li>Teams join at the landing page using their codes</li>
            <li>From the game dashboard, advance cycles and inject shocks</li>
            <li>After each cycle, view CAS breakdowns and team performance</li>
            <li>Export results at the end for debrief analysis</li>
          </ol>
        </div>
      </main>
    </div>
  );
}
