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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Value Chain Simulation
          </h1>
          <p className="text-blue-200">
            Strategic Investment Decision Game
          </p>
        </div>

        {/* Join Card */}
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Join Game
          </h2>

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label
                htmlFor="teamCode"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Team Code
              </label>
              <input
                id="teamCode"
                type="text"
                value={teamCode}
                onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                placeholder="Enter your 6-digit code"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-xl font-mono tracking-widest uppercase"
                maxLength={6}
                autoComplete="off"
              />
            </div>

            <div>
              <label
                htmlFor="teamName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Team Name (Optional)
              </label>
              <input
                id="teamName"
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Choose a team name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={30}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isJoining}
              className="w-full py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isJoining ? 'Joining...' : 'Join Game'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-sm text-gray-500">
              Your instructor will provide your team code.
            </p>
          </div>
        </div>

        {/* Instructor Link */}
        <div className="mt-6 text-center">
          <Link
            href="/instructor/login"
            className="text-blue-200 hover:text-white text-sm underline"
          >
            Instructor Login
          </Link>
        </div>
      </div>
    </div>
  );
}
