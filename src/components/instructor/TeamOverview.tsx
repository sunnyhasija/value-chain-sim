'use client';

import { Team, TeamRanking, TeamActivity } from '@/lib/types';
import { HealthBar } from '../shared/HealthBar';

interface TeamOverviewProps {
  teams: Team[];
  rankings: TeamRanking[];
  teamActivities: Record<string, TeamActivity[]>;
  onSelectTeam?: (teamId: string) => void;
  selectedTeamId?: string;
}

export function TeamOverview({
  teams,
  rankings,
  teamActivities,
  onSelectTeam,
  selectedTeamId,
}: TeamOverviewProps) {
  const getRankBadge = (rank: number) => {
    const colors: Record<number, string> = {
      1: 'bg-yellow-400 text-yellow-900',
      2: 'bg-gray-300 text-gray-900',
      3: 'bg-amber-600 text-white',
    };
    return colors[rank] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-900">Team Status</h3>

      <div className="space-y-2">
        {rankings.map((ranking) => {
          const team = teams.find((t) => t.id === ranking.teamId);
          if (!team) return null;

          const activities = teamActivities[team.id] || [];
          const avgHealth =
            activities.length > 0
              ? activities.reduce((sum, a) => sum + a.health, 0) / activities.length
              : 0;

          return (
            <div
              key={team.id}
              onClick={() => onSelectTeam?.(team.id)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedTeamId === team.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${getRankBadge(
                      ranking.rank
                    )}`}
                  >
                    {ranking.rank}
                  </span>
                  <div>
                    <div className="font-medium text-gray-900">{team.name}</div>
                    <div className="text-xs text-gray-500">Code: {team.code}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    {team.cas > 0 ? '+' : ''}
                    {team.cas.toFixed(1)} CAS
                  </div>
                  <div
                    className={`text-xs ${
                      ranking.hasSubmitted ? 'text-green-600' : 'text-yellow-600'
                    }`}
                  >
                    {ranking.hasSubmitted ? 'Submitted' : 'Pending'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div>
                  Budget: <span className="font-medium">${team.budget.toFixed(1)}M</span>
                </div>
                <div>
                  Margin: <span className="font-medium">{team.margin.toFixed(1)}%</span>
                </div>
              </div>

              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Avg Health</span>
                  <span>{avgHealth.toFixed(0)}</span>
                </div>
                <HealthBar value={avgHealth} size="sm" showValue={false} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface TeamSummaryCardProps {
  team: Team;
  rank: number;
  hasSubmitted: boolean;
}

export function TeamSummaryCard({ team, rank, hasSubmitted }: TeamSummaryCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-gray-400">#{rank}</span>
          <span className="font-medium text-gray-900">{team.name}</span>
        </div>
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            hasSubmitted
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {hasSubmitted ? 'Submitted' : 'Pending'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-blue-600">
            {team.cas > 0 ? '+' : ''}
            {team.cas.toFixed(1)}
          </div>
          <div className="text-xs text-gray-500">CAS</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-700">
            {team.margin.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500">Margin</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-green-600">
            ${team.budget.toFixed(1)}M
          </div>
          <div className="text-xs text-gray-500">Budget</div>
        </div>
      </div>
    </div>
  );
}
