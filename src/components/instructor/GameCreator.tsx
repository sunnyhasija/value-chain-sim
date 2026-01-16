'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface TeamCode {
  teamNumber: number;
  code: string;
}

export function GameCreator() {
  const router = useRouter();
  const [teamCount, setTeamCount] = useState(8);
  const [maxCycles, setMaxCycles] = useState(4);
  const [isCreating, setIsCreating] = useState(false);
  const [createdGame, setCreatedGame] = useState<{
    sessionId: string;
    instructorCode: string;
    teamCodes: TeamCode[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/game/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamCount, maxCycles }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create game');
      }

      const data = await response.json();
      setCreatedGame(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartGame = () => {
    if (createdGame) {
      router.push(`/instructor/game/${createdGame.sessionId}`);
    }
  };

  if (createdGame) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-green-600 mb-4">Game Created!</h2>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Instructor Code</h3>
          <p className="text-2xl font-mono font-bold text-blue-600">
            {createdGame.instructorCode}
          </p>
          <p className="text-sm text-blue-700 mt-1">
            Save this code to access the game dashboard
          </p>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Team Codes</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {createdGame.teamCodes.map(({ teamNumber, code }) => (
              <div
                key={teamNumber}
                className="p-3 bg-gray-50 rounded-lg text-center"
              >
                <div className="text-xs text-gray-500 mb-1">Team {teamNumber}</div>
                <div className="font-mono font-bold text-lg">{code}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => {
              const text = createdGame.teamCodes
                .map(({ teamNumber, code }) => `Team ${teamNumber}: ${code}`)
                .join('\n');
              navigator.clipboard.writeText(text);
            }}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Copy All Codes
          </button>
          <button
            onClick={handleStartGame}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Game</h2>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Number of Teams
        </label>
        <div className="grid grid-cols-5 gap-2">
          {[4, 6, 8, 10, 12].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setTeamCount(n)}
              className={`py-2 rounded-lg border text-sm font-medium transition-colors ${
                teamCount === n
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="mt-2 text-xs text-gray-500">Selected: {teamCount} teams</div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Number of Rounds
        </label>
        <div className="grid grid-cols-5 gap-2">
          {[2, 3, 4, 5, 6].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setMaxCycles(n)}
              className={`py-2 rounded-lg border text-sm font-medium transition-colors ${
                maxCycles === n
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="mt-2 text-xs text-gray-500">Selected: {maxCycles} rounds</div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">{error}</div>
      )}

      <button
        onClick={handleCreate}
        disabled={isCreating}
        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isCreating ? 'Creating...' : 'Create Game'}
      </button>
    </div>
  );
}
