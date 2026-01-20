'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const [teamCode, setTeamCode] = useState('');
  const [teamName, setTeamName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamCode.trim()) {
      setError('Please enter your team code');
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      const response = await fetch('/api/game/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: teamCode.trim().toUpperCase(),
          teamName: teamName.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join game');
      }

      // Store team ID in localStorage for persistence
      localStorage.setItem('teamId', data.teamId);
      localStorage.setItem('teamCode', teamCode.trim().toUpperCase());

      // Navigate to team page
      router.push(`/team/${teamCode.trim().toUpperCase()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 right-8 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />
        </div>

        <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-6 py-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.25em] text-slate-200">
              Strategy Simulation
            </div>
            <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
              Value Chain Investment Simulation
            </h1>
            <p className="text-base text-slate-300 sm:text-lg">
              A competitive decision game where teams allocate limited capital
              across operational activities and adapt under pressure.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
                  What You Do
                </p>
                <p className="mt-2 text-sm text-slate-200">
                  Set priorities, invest in capabilities, and manage overhead
                  while staying within budget.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
                  How It Works
                </p>
                <p className="mt-2 text-sm text-slate-200">
                  Each cycle advances the simulation. Performance shifts, ranks
                  update, and new conditions appear.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="rounded-full border border-white/10 px-3 py-1">
                4 Cycles
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1">
                Team Based
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1">
                Timed Decisions
              </span>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white p-8 text-slate-900 shadow-2xl">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-semibold">Join Game</h2>
              <p className="mt-1 text-sm text-slate-500">
                Enter your team code to begin.
              </p>
            </div>

            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label
                  htmlFor="teamCode"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Team Code
                </label>
                <input
                  id="teamCode"
                  type="text"
                  value={teamCode}
                  onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                  placeholder="Enter your 6-digit code"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-xl font-mono tracking-widest uppercase focus:border-slate-900 focus:outline-none"
                  maxLength={6}
                  autoComplete="off"
                />
              </div>

              <div>
                <label
                  htmlFor="teamName"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Team Name (Optional)
                </label>
                <input
                  id="teamName"
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Choose a team name"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-slate-900 focus:outline-none"
                  maxLength={30}
                />
              </div>

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                  <p className="text-sm text-rose-700">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isJoining}
                className="w-full rounded-xl bg-slate-900 py-4 text-lg font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isJoining ? 'Joining...' : 'Join Game'}
              </button>
            </form>

            <div className="mt-6 border-t pt-4 text-center text-sm text-slate-500">
              Your instructor will provide your team code.
            </div>

            <div className="mt-4 text-center">
              <Link
                href="/instructor/login"
                className="text-sm font-semibold text-slate-700 hover:text-slate-900"
              >
                Instructor Login
              </Link>
            </div>

            <p className="mt-4 text-center text-xs text-slate-400">
              Built by Professors at GVSU
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
