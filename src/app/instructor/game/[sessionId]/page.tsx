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
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Game Management
              </h1>
              <p className="text-sm text-gray-500">
                Session: {sessionId.slice(0, 8)}...
              </p>
            </div>
            <div className="flex items-center gap-6">
              {gameState.session.cycleStartTime > 0 && (
                <CountdownDisplay
                  startTime={gameState.session.cycleStartTime}
                  duration={gameState.session.cycleTimeLimit}
                />
              )}
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {gameState.session.currentCycle} / {MAX_CYCLES}
                </div>
                <div className="text-xs text-gray-500">Cycle</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {submittedCount} / {gameState.teams.length}
                </div>
                <div className="text-xs text-gray-500">Submitted</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {isGameComplete ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center mb-6">
            <h2 className="text-3xl font-bold text-green-800 mb-4">
              Game Complete!
            </h2>
            <p className="text-green-700 mb-6">
              All {MAX_CYCLES} cycles have been completed.
            </p>
            <ExportButton sessionId={sessionId} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Team Overview */}
            <div className="lg:col-span-1">
              <TeamOverview
                teams={gameState.teams}
                rankings={gameState.rankings}
                teamActivities={gameState.teamActivities}
                selectedTeamId={selectedTeamId || undefined}
                onSelectTeam={setSelectedTeamId}
              />
            </div>

            {/* Middle Column - CAS Breakdown */}
            <div className="lg:col-span-1">
              {selectedTeam && selectedActivities ? (
                <CASBreakdown team={selectedTeam} activities={selectedActivities} />
              ) : (
                <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                  Select a team to view CAS breakdown
                </div>
              )}
            </div>

            {/* Right Column - Controls */}
            <div className="lg:col-span-1 space-y-6">
              {/* Shock Injector */}
              {gameState.session.currentCycle > 0 && (
                <ShockInjector
                  sessionId={sessionId}
                  currentCycle={gameState.session.currentCycle}
                  currentShock={gameState.currentShock}
                  onShockInjected={fetchGameState}
                />
              )}

              {/* Advance Cycle Button */}
              <div className="bg-white rounded-lg shadow p-4">
                <h4 className="font-semibold text-gray-900 mb-4">
                  {gameState.session.currentCycle === 0
                    ? 'Start Game'
                    : gameState.session.currentCycle >= MAX_CYCLES
                    ? 'End Game'
                    : 'Advance Cycle'}
                </h4>

                {gameState.session.currentCycle === 0 ? (
                  <p className="text-sm text-gray-600 mb-4">
                    Click below to start cycle 1. Teams will see the company brief
                    and can begin making investment decisions.
                  </p>
                ) : (
                  <p className="text-sm text-gray-600 mb-4">
                    {submittedCount} of {gameState.teams.length} teams have
                    submitted. Advancing will process all decisions and calculate
                    results.
                  </p>
                )}

                <button
                  onClick={handleAdvanceCycle}
                  disabled={isAdvancing || !canAdvance}
                  className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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

              {/* Export */}
              {gameState.session.currentCycle > 0 && (
                <div className="bg-white rounded-lg shadow p-4">
                  <h4 className="font-semibold text-gray-900 mb-4">Export Data</h4>
                  <ExportButton sessionId={sessionId} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Final Rankings */}
        {isGameComplete && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Final Rankings
            </h3>
            <div className="space-y-3">
              {gameState.rankings.map((ranking) => (
                <div
                  key={ranking.teamId}
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    ranking.rank === 1
                      ? 'bg-yellow-50 border-2 border-yellow-400'
                      : ranking.rank === 2
                      ? 'bg-gray-50 border-2 border-gray-300'
                      : ranking.rank === 3
                      ? 'bg-amber-50 border-2 border-amber-400'
                      : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={`w-10 h-10 flex items-center justify-center rounded-full text-lg font-bold ${
                        ranking.rank === 1
                          ? 'bg-yellow-400 text-yellow-900'
                          : ranking.rank === 2
                          ? 'bg-gray-300 text-gray-900'
                          : ranking.rank === 3
                          ? 'bg-amber-500 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {ranking.rank}
                    </span>
                    <span className="text-lg font-medium text-gray-900">
                      {ranking.teamName}
                    </span>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-2xl font-bold ${
                        ranking.cas >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {ranking.cas > 0 ? '+' : ''}
                      {ranking.cas.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-500">Total CAS</div>
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
