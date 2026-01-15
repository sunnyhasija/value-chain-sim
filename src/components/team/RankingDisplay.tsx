'use client';

import { TeamRanking } from '@/lib/types';

interface RankingDisplayProps {
  rankings: TeamRanking[];
  currentTeamId: string;
  compact?: boolean;
}

export function RankingDisplay({
  rankings,
  currentTeamId,
  compact = false,
}: RankingDisplayProps) {
  const currentTeam = rankings.find((r) => r.teamId === currentTeamId);

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-500">Rank:</span>
        <span className="font-bold text-blue-600">
          #{currentTeam?.rank || '--'}
        </span>
        <span className="text-gray-400">of {rankings.length}</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold text-gray-900 mb-3">Current Rankings</h3>
      <div className="space-y-2">
        {rankings.map((ranking) => {
          const isCurrentTeam = ranking.teamId === currentTeamId;
          return (
            <div
              key={ranking.teamId}
              className={`flex items-center justify-between p-2 rounded ${
                isCurrentTeam ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-6 h-6 flex items-center justify-center rounded-full text-sm font-bold ${
                    ranking.rank === 1
                      ? 'bg-yellow-400 text-yellow-900'
                      : ranking.rank === 2
                      ? 'bg-gray-300 text-gray-900'
                      : ranking.rank === 3
                      ? 'bg-amber-600 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {ranking.rank}
                </span>
                <span
                  className={`font-medium ${
                    isCurrentTeam ? 'text-blue-900' : 'text-gray-700'
                  }`}
                >
                  {ranking.teamName}
                  {isCurrentTeam && ' (You)'}
                </span>
              </div>
              <span
                className={`font-bold ${
                  ranking.cas >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {ranking.cas > 0 ? '+' : ''}
                {ranking.cas.toFixed(1)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface TeamRankBadgeProps {
  rank: number;
  totalTeams: number;
}

export function TeamRankBadge({ rank, totalTeams }: TeamRankBadgeProps) {
  const getColor = () => {
    if (rank === 1) return 'bg-yellow-400 text-yellow-900';
    if (rank === 2) return 'bg-gray-300 text-gray-900';
    if (rank === 3) return 'bg-amber-600 text-white';
    if (rank <= totalTeams / 2) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className={`px-3 py-1 rounded-full ${getColor()}`}>
      <span className="font-bold">#{rank}</span>
      <span className="text-xs ml-1 opacity-70">/{totalTeams}</span>
    </div>
  );
}
