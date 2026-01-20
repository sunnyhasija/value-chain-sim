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
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Instructor Console
            </p>
            <h1 className="text-2xl font-semibold text-white">
              Game Control Center
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-300">
              {session.user?.name}
            </span>
            <Link
              href="/api/auth/signout"
              className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
            >
              Sign Out
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-6 py-10">
        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg">
            <h2 className="text-2xl font-semibold text-white">
              Value Chain Investment Simulation
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Create a session, distribute team codes, and guide the simulation
              across cycles.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                'Create session',
                'Share team codes',
                'Advance cycles',
              ].map((label) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-200"
                >
                  {label}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white p-6 text-slate-900 shadow-lg">
            <GameCreator />
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-white mb-4">
            Quick Start Guide
          </h3>
          <ol className="grid gap-3 text-sm text-slate-200 sm:grid-cols-2">
            <li>Click “Create Game” to generate a new session with team codes</li>
            <li>Distribute the unique team codes to each student team</li>
            <li>Teams join at the landing page using their codes</li>
            <li>From the game dashboard, advance cycles and inject shocks</li>
            <li>After each cycle, view CAS breakdowns and team performance</li>
            <li>Export results at the end for debrief analysis</li>
          </ol>
        </section>

        <p className="text-center text-xs text-slate-500">
          Built by Professors at GVSU
        </p>
      </main>
    </div>
  );
}
