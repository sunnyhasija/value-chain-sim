'use client';

import { Team, TeamActivity, CycleResult } from '@/lib/types';
import { getActivityById } from '@/lib/activities';
import { getLinkageById } from '@/lib/linkages';
import { HealthBar } from '../shared/HealthBar';

interface CASBreakdownProps {
  team: Team;
  activities: TeamActivity[];
}

export function CASBreakdown({ team, activities }: CASBreakdownProps) {
  const latestResult = team.cycleResults[team.cycleResults.length - 1];

  if (!latestResult) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold text-gray-900 mb-4">CAS Breakdown - {team.name}</h3>
        <p className="text-gray-500">No results yet. Game will start after cycle 1.</p>
      </div>
    );
  }

  const { casBreakdown, activeLinkages, orphanedLinkages } = latestResult;

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">CAS Breakdown - {team.name}</h3>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">
            {latestResult.casChange > 0 ? '+' : ''}
            {latestResult.casChange.toFixed(1)}
          </div>
          <div className="text-xs text-gray-500">Cycle {latestResult.cycle}</div>
        </div>
      </div>

      {/* Base Score */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="font-medium text-gray-700">Base Score (vs average)</span>
          <span
            className={`font-bold ${
              casBreakdown.baseScore >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {casBreakdown.baseScore > 0 ? '+' : ''}
            {casBreakdown.baseScore.toFixed(1)}
          </span>
        </div>
        <div className="text-xs text-gray-500 pl-4">
          Weighted average of primary activity health vs. industry average
        </div>
      </div>

      {/* Linkage Bonuses */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="font-medium text-gray-700">Linkage Bonuses</span>
          <span className="font-bold text-green-600">
            +
            {Object.values(casBreakdown.linkageBonuses)
              .reduce((a, b) => a + b, 0)
              .toFixed(1)}
          </span>
        </div>

        {activeLinkages.length > 0 ? (
          <div className="pl-4 space-y-1">
            {activeLinkages.map((linkageId) => {
              const linkage = getLinkageById(linkageId);
              const bonus = casBreakdown.linkageBonuses[linkageId] || 0;
              return (
                <div key={linkageId} className="flex justify-between text-sm">
                  <span className="text-green-600">
                    [Active] {linkage?.description.slice(0, 40)}...
                  </span>
                  <span className="font-medium text-green-600">+{bonus.toFixed(1)}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-sm text-gray-500 pl-4">No active linkages</div>
        )}

        {orphanedLinkages.length > 0 && (
          <div className="pl-4 space-y-1 mt-2">
            <div className="text-xs font-medium text-gray-500">Inactive Linkages:</div>
            {orphanedLinkages.slice(0, 3).map((linkageId) => {
              const linkage = getLinkageById(linkageId);
              return (
                <div key={linkageId} className="text-xs text-red-500">
                  [Below threshold] {linkage?.description.slice(0, 50)}...
                </div>
              );
            })}
            {orphanedLinkages.length > 3 && (
              <div className="text-xs text-gray-400">
                +{orphanedLinkages.length - 3} more inactive
              </div>
            )}
          </div>
        )}
      </div>

      {/* NVA Drag */}
      {casBreakdown.nvaDrag !== 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">NVA Drag</span>
            <span className="font-bold text-red-600">{casBreakdown.nvaDrag.toFixed(1)}</span>
          </div>
          <div className="text-xs text-gray-500 pl-4">
            Penalty from maintaining non-value-add activities
          </div>
        </div>
      )}

      {/* Shock Effect */}
      {casBreakdown.shockEffect !== 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Shock Effect</span>
            <span
              className={`font-bold ${
                casBreakdown.shockEffect >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {casBreakdown.shockEffect > 0 ? '+' : ''}
              {casBreakdown.shockEffect.toFixed(1)}
            </span>
          </div>
          <div className="text-xs text-gray-500 pl-4">
            {casBreakdown.shockEffect > 0
              ? 'Bonus for shock resilience'
              : 'Impact from external shock'}
          </div>
        </div>
      )}

      {/* Total */}
      <div className="pt-4 border-t">
        <div className="flex justify-between items-center">
          <span className="font-bold text-gray-900">Cycle Total</span>
          <span
            className={`text-xl font-bold ${
              casBreakdown.total >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {casBreakdown.total > 0 ? '+' : ''}
            {casBreakdown.total.toFixed(1)}
          </span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-gray-600">Cumulative CAS</span>
          <span className="font-bold text-blue-600">
            {team.cas > 0 ? '+' : ''}
            {team.cas.toFixed(1)} (Rank #{latestResult.rank})
          </span>
        </div>
      </div>

      {/* Activity Health Summary */}
      <div className="pt-4 border-t">
        <h4 className="font-medium text-gray-700 mb-3">Activity Health</h4>
        <div className="space-y-2">
          {activities
            .filter((a) => {
              const def = getActivityById(a.activityId);
              return def?.category !== 'non-value-add';
            })
            .map((activity) => {
              const def = getActivityById(activity.activityId);
              return (
                <div key={activity.activityId} className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 w-32 truncate">
                    {def?.name}
                  </span>
                  <HealthBar
                    value={activity.health}
                    size="sm"
                    className="flex-1"
                  />
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
