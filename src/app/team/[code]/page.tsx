'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Team, TeamActivity, TeamRanking, GameSession, ShockDefinition, MAX_CYCLES } from '@/lib/types';
import { CompanyBrief } from '@/components/team/CompanyBrief';
import { InvestmentAllocator } from '@/components/team/InvestmentAllocator';
import { RankingDisplay } from '@/components/team/RankingDisplay';
import { ShockAnnouncement, ShockBanner } from '@/components/team/ShockAnnouncement';
import { CountdownDisplay } from '@/components/shared/Timer';
import { getPusherClient, getSessionChannel, EVENTS } from '@/lib/pusher';

interface TeamGameState {
  team: Team;
  activities: TeamActivity[];
  session: GameSession;
  rankings: TeamRanking[];
  currentShock: ShockDefinition | null;
}

export default function TeamGamePage() {
  const params = useParams();
  const router = useRouter();
  const teamCode = params.code as string;

  const [gameState, setGameState] = useState<TeamGameState | null>(null);
  const [showBrief, setShowBrief] = useState(true);
  const [showShockModal, setShowShockModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isActivatingInnovationLab, setIsActivatingInnovationLab] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastShockId, setLastShockId] = useState<string | null>(null);

  const fetchGameState = useCallback(async (markSeen = false) => {
    const teamId = localStorage.getItem('teamId');
    if (!teamId) {
      router.push('/');
      return;
    }

    try {
      const url = `/api/game/state?teamId=${teamId}${markSeen ? '&markSeen=true' : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) {
          localStorage.removeItem('teamId');
          localStorage.removeItem('teamCode');
          router.push('/');
          return;
        }
        throw new Error('Failed to fetch game state');
      }

      const data = await response.json();
      setGameState(data);

      // Show brief if not seen yet
      if (!data.team.hasSeenBrief) {
        setShowBrief(true);
      } else {
        setShowBrief(false);
      }

      // Show shock modal only when a new shock arrives
      if (data.currentShock) {
        if (data.currentShock.id !== lastShockId) {
          setShowShockModal(true);
          setLastShockId(data.currentShock.id);
        }
      } else {
        setLastShockId(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  }, [router, lastShockId]);

  useEffect(() => {
    // Verify team code matches
    const storedCode = localStorage.getItem('teamCode');
    if (storedCode !== teamCode.toUpperCase()) {
      router.push('/');
      return;
    }

    fetchGameState();
  }, [teamCode, fetchGameState, router]);

  // Set up Pusher for real-time updates
  useEffect(() => {
    if (!gameState) return;

    try {
      const pusher = getPusherClient();
      const channel = pusher.subscribe(getSessionChannel(gameState.session.id));

      channel.bind(EVENTS.CYCLE_ADVANCED, () => {
        fetchGameState();
      });

      channel.bind(EVENTS.SHOCK_ANNOUNCED, (data: { shock: ShockDefinition }) => {
        setShowShockModal(true);
        fetchGameState();
      });

      channel.bind(EVENTS.GAME_COMPLETED, () => {
        fetchGameState();
      });

      return () => {
        channel.unbind_all();
        pusher.unsubscribe(getSessionChannel(gameState.session.id));
      };
    } catch (err) {
      // Pusher not configured, fall back to polling
      const interval = setInterval(() => fetchGameState(), 5000);
      return () => clearInterval(interval);
    }
  }, [gameState?.session.id, fetchGameState]);

  const handleBriefContinue = async () => {
    await fetchGameState(true);
    setShowBrief(false);
  };

  const handleSubmitDecisions = async (
    allocations: Record<string, number>,
    cuts: string[]
  ) => {
    const teamId = localStorage.getItem('teamId');
    if (!teamId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/game/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, allocations, cuts }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit decisions');
      }

      await fetchGameState();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivateInnovationLab = async () => {
    const teamId = localStorage.getItem('teamId');
    if (!teamId) return;

    setIsActivatingInnovationLab(true);
    setError(null);

    try {
      const response = await fetch('/api/game/innovation/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to activate Innovation Lab');
      }

      await fetchGameState();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsActivatingInnovationLab(false);
    }
  };

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // Show company brief first
  if (showBrief && gameState.session.status !== 'lobby') {
    return (
      <CompanyBrief
        teamName={gameState.team.name}
        onContinue={handleBriefContinue}
      />
    );
  }

  // Waiting room before game starts
  if (gameState.session.status === 'lobby') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="text-6xl mb-4">&#128337;</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Waiting for Game to Start
          </h1>
          <p className="text-gray-600 mb-4">
            You&apos;ve joined as <strong>{gameState.team.name}</strong>
          </p>
          <p className="text-sm text-gray-500">
            The instructor will start the game shortly.
          </p>
        </div>
      </div>
    );
  }

  // Game completed
  if (gameState.session.status === 'completed') {
    const teamRanking = gameState.rankings.find(
      (r) => r.teamId === gameState.team.id
    );

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-8">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">
              {teamRanking?.rank === 1 ? '&#127942;' : '&#127881;'}
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Game Complete!</h1>
            <p className="text-gray-600 mt-2">
              Final Results for {gameState.team.name}
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-4xl font-bold text-blue-600">
                  #{teamRanking?.rank || '--'}
                </div>
                <div className="text-sm text-gray-500">Final Rank</div>
              </div>
              <div>
                <div
                  className={`text-4xl font-bold ${
                    gameState.team.cas >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {gameState.team.cas > 0 ? '+' : ''}
                  {gameState.team.cas.toFixed(1)}
                </div>
                <div className="text-sm text-gray-500">Total CAS</div>
              </div>
            </div>
          </div>

          <RankingDisplay
            rankings={gameState.rankings}
            currentTeamId={gameState.team.id}
          />
        </div>
      </div>
    );
  }

  // Active game
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Shock Modal */}
      {showShockModal && gameState.currentShock && (
        <ShockAnnouncement
          shock={gameState.currentShock}
          onDismiss={() => setShowShockModal(false)}
        />
      )}

      {/* Header */}
      <header className="bg-white shadow sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                {gameState.team.name}
              </h1>
              <p className="text-sm text-gray-500">
                Cycle {gameState.session.currentCycle} of {MAX_CYCLES}
              </p>
            </div>
            <div className="flex items-center gap-6">
              {gameState.session.cycleStartTime > 0 && (
                <CountdownDisplay
                  startTime={gameState.session.cycleStartTime}
                  duration={gameState.session.cycleTimeLimit}
                />
              )}
              <RankingDisplay
                rankings={gameState.rankings}
                currentTeamId={gameState.team.id}
                compact
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Shock Banner */}
        {gameState.currentShock && !showShockModal && (
          <div className="mb-6">
            <ShockBanner shock={gameState.currentShock} />
          </div>
        )}

        {/* Investment Allocator */}
        <InvestmentAllocator
          activities={gameState.activities}
          budget={gameState.team.budget}
          onSubmit={handleSubmitDecisions}
          onActivateInnovationLab={handleActivateInnovationLab}
          isActivatingInnovationLab={isActivatingInnovationLab}
          isSubmitting={isSubmitting}
          hasSubmitted={gameState.team.hasSubmitted}
        />

        {/* Rankings */}
        <div className="mt-6">
          <RankingDisplay
            rankings={gameState.rankings}
            currentTeamId={gameState.team.id}
          />
        </div>
      </main>
    </div>
  );
}
