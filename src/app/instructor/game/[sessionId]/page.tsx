'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { GameSession, Team, TeamActivity, TeamRanking, ShockDefinition, MAX_CYCLES } from '@/lib/types';
import { TeamOverview } from '@/components/instructor/TeamOverview';
import { CASBreakdown } from '@/components/instructor/CASBreakdown';
import { ShockInjector } from '@/components/instructor/ShockInjector';
import { ExportButton } from '@/components/instructor/ExportButton';
import { CountdownDisplay } from '@/components/shared/Timer';

interface GameState {
  session: GameSession;
  teams: Team[];
  teamActivities: Record<string, TeamActivity[]>;
  rankings: TeamRanking[];
  currentShock: ShockDefinition | null;
}

export default function InstructorGamePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGameState = useCallback(async () => {
    try {
      const response = await fetch(`/api/game/state?sessionId=${sessionId}`);
      if (!response.ok) throw new Error('Failed to fetch game state');
      const data = await response.json();
      setGameState(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  }, [sessionId]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/instructor/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchGameState();
      const interval = setInterval(fetchGameState, 5000); // Poll every 5 seconds
      return () => clearInterval(interval);
    }
  }, [session, fetchGameState]);

  const handleAdvanceCycle = async () => {
    if (!gameState) return;

    setIsAdvancing(true);
    setError(null);

    try {
      const response = await fetch('/api/game/advance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          shockId: gameState.currentShock?.id || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to advance cycle');
      }

      await fetchGameState();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsAdvancing(false);
    }
  };

  if (status === 'loading' || !gameState) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const selectedTeam = selectedTeamId
    ? gameState.teams.find((t) => t.id === selectedTeamId)
    : null;
  const selectedActivities = selectedTeamId
    ? gameState.teamActivities[selectedTeamId]
    : null;

  const submittedCount = gameState.teams.filter((t) => t.hasSubmitted).length;
  const isGameComplete = gameState.session.status === 'completed';
  const canAdvance = gameState.session.currentCycle > 0 || gameState.session.status === 'lobby';

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Live Session
            </p>
            <h1 className="text-2xl font-semibold text-white">Game Management</h1>
          </div>
          <div className="flex items-center gap-6">
            {gameState.session.cycleStartTime > 0 && (
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                <CountdownDisplay
                  startTime={gameState.session.cycleStartTime}
                  duration={gameState.session.cycleTimeLimit}
                />
              </div>
            )}
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-center">
              <div className="text-xl font-semibold text-white">
                {gameState.session.currentCycle} / {MAX_CYCLES}
              </div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                Cycle
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-center">
              <div className="text-xl font-semibold text-emerald-300">
                {submittedCount} / {gameState.teams.length}
              </div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                Submitted
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {error && (
          <div className="mb-6 rounded-2xl border border-rose-300/40 bg-rose-500/10 p-4 text-rose-100">
            {error}
          </div>
        )}

        {isGameComplete ? (
          <div className="mb-6 rounded-3xl border border-emerald-200/20 bg-emerald-500/10 p-8 text-center">
            <h2 className="text-3xl font-semibold text-emerald-100 mb-3">
              Game Complete!
            </h2>
            <p className="text-emerald-200 mb-6">
              All {MAX_CYCLES} cycles have been completed.
            </p>
            <ExportButton sessionId={sessionId} />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr_0.9fr]">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-lg">
              <TeamOverview
                teams={gameState.teams}
                rankings={gameState.rankings}
                teamActivities={gameState.teamActivities}
                selectedTeamId={selectedTeamId || undefined}
                onSelectTeam={setSelectedTeamId}
              />
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-lg">
              {selectedTeam && selectedActivities ? (
                <CASBreakdown team={selectedTeam} activities={selectedActivities} />
              ) : (
                <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 text-center text-slate-300">
                  Select a team to view CAS breakdown
                </div>
              )}
            </div>

            <div className="space-y-6">
              {gameState.session.currentCycle > 0 && (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-lg">
                  <ShockInjector
                    sessionId={sessionId}
                    currentCycle={gameState.session.currentCycle}
                    currentShock={gameState.currentShock}
                    onShockInjected={fetchGameState}
                  />
                </div>
              )}

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-lg">
                <h4 className="text-base font-semibold text-white mb-3">
                  {gameState.session.currentCycle === 0
                    ? 'Start Game'
                    : gameState.session.currentCycle >= MAX_CYCLES
                    ? 'End Game'
                    : 'Advance Cycle'}
                </h4>

                {gameState.session.currentCycle === 0 ? (
                  <p className="text-sm text-slate-300 mb-4">
                    Start cycle 1 so teams can review the brief and begin making
                    decisions.
                  </p>
                ) : (
                  <p className="text-sm text-slate-300 mb-4">
                    {submittedCount} of {gameState.teams.length} teams have
                    submitted. Advancing will process all decisions and calculate
                    results.
                  </p>
                )}

                <button
                  onClick={handleAdvanceCycle}
                  disabled={isAdvancing || !canAdvance}
                  className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isAdvancing
                    ? 'Processing...'
                    : gameState.session.currentCycle === 0
                    ? 'Start Cycle 1'
                    : gameState.session.currentCycle >= MAX_CYCLES
                    ? 'Complete Game'
                    : `Advance to Cycle ${gameState.session.currentCycle + 1}`}
                </button>
              </div>

              {gameState.session.currentCycle > 0 && (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-lg">
                  <h4 className="text-base font-semibold text-white mb-3">
                    Export Data
                  </h4>
                  <ExportButton sessionId={sessionId} />
                </div>
              )}
            </div>
          </div>
        )}

        {isGameComplete && (
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg">
            <h3 className="text-xl font-semibold text-white mb-4">
              Final Rankings
            </h3>
            <div className="space-y-3">
              {gameState.rankings.map((ranking) => (
                <div
                  key={ranking.teamId}
                  className={`flex items-center justify-between rounded-2xl border p-4 ${
                    ranking.rank === 1
                      ? 'border-amber-400/60 bg-amber-500/10'
                      : ranking.rank === 2
                      ? 'border-slate-300/40 bg-white/5'
                      : ranking.rank === 3
                      ? 'border-amber-300/40 bg-amber-400/10'
                      : 'border-white/10 bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold ${
                        ranking.rank === 1
                          ? 'bg-amber-400 text-amber-900'
                          : ranking.rank === 2
                          ? 'bg-slate-300 text-slate-900'
                          : ranking.rank === 3
                          ? 'bg-amber-500 text-white'
                          : 'bg-white/10 text-slate-200'
                      }`}
                    >
                      {ranking.rank}
                    </span>
                    <span className="text-lg font-medium text-white">
                      {ranking.teamName}
                    </span>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-2xl font-semibold ${
                        ranking.cas >= 0 ? 'text-emerald-300' : 'text-rose-300'
                      }`}
                    >
                      {ranking.cas > 0 ? '+' : ''}
                      {ranking.cas.toFixed(1)}
                    </div>
                    <div className="text-xs text-slate-400">Total CAS</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
