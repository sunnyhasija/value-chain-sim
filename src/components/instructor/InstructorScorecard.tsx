import { Decision, Team, TeamRanking } from '@/lib/types';
import { ALL_ACTIVITIES, NON_VALUE_ADD_ACTIVITIES } from '@/lib/activities';

type ContributionTotals = {
  base: number;
  linkage: number;
  nvaDrag: number;
  shock: number;
};

type StructureSummary = {
  valueCreatingPct: number;
  valueSupportingPct: number;
  nvaMaintenancePct: number;
  top2Share: number;
  top4Share: number;
  stabilityCount: number;
};

type TimelineEntry = {
  cycle: number;
  majorAdds: string[];
  majorCuts: string[];
  reallocationIntensity: number;
};

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function formatDelta(value: number): string {
  if (value > 0) return `+${value.toFixed(1)}`;
  if (value < 0) return value.toFixed(1);
  return '0.0';
}

function getPercentileBucket(rank: number, total: number): string {
  const quartile = Math.ceil((rank / total) * 4);
  if (quartile === 1) return 'Top 25%';
  if (quartile === 2 || quartile === 3) return 'Middle 50%';
  return 'Bottom 25%';
}

function getTeamContributions(team: Team): ContributionTotals {
  return team.cycleResults.reduce(
    (totals, result) => {
      totals.base += result.casBreakdown.baseScore;
      totals.linkage += sum(Object.values(result.casBreakdown.linkageBonuses));
      totals.nvaDrag += result.casBreakdown.nvaDrag;
      totals.shock += result.casBreakdown.shockEffect;
      return totals;
    },
    { base: 0, linkage: 0, nvaDrag: 0, shock: 0 }
  );
}

function computeOrdinalRanks(values: { teamId: string; value: number }[], descending = true) {
  const sorted = [...values].sort((a, b) =>
    descending ? b.value - a.value : a.value - b.value
  );
  const rankMap = new Map<string, number>();
  sorted.forEach((item, index) => {
    rankMap.set(item.teamId, index + 1);
  });
  return rankMap;
}

function getAllocationTotals(decisions: Decision[]): Record<string, number> {
  const totals: Record<string, number> = {};
  decisions.forEach((decision) => {
    Object.entries(decision.allocations || {}).forEach(([activityId, value]) => {
      totals[activityId] = (totals[activityId] || 0) + value;
    });
  });
  return totals;
}

function getStructureSummary(team: Team, decisions: Decision[]): StructureSummary {
  const allocationTotals = getAllocationTotals(decisions);
  const allocationSum = sum(Object.values(allocationTotals));

  const byCategory: Record<string, number> = {};
  Object.entries(allocationTotals).forEach(([activityId, value]) => {
    const def = ALL_ACTIVITIES.find((activity) => activity.id === activityId);
    if (!def) return;
    byCategory[def.category] = (byCategory[def.category] || 0) + value;
  });

  const maintenanceTotal = team.cycleResults.reduce((total, result) => {
    const nvaCost = NON_VALUE_ADD_ACTIVITIES.reduce((sumCost, activity) => {
      const health = result.newHealth?.[activity.id] ?? 0;
      if (health > 0) {
        return sumCost + (activity.maintenanceCost || 0);
      }
      return sumCost;
    }, 0);
    return total + nvaCost;
  }, 0);

  const combinedSpend = allocationSum + maintenanceTotal;
  const valueCreatingPct =
    combinedSpend > 0 ? (byCategory['value-creating'] || 0) / combinedSpend : 0;
  const valueSupportingPct =
    combinedSpend > 0 ? (byCategory['value-supporting'] || 0) / combinedSpend : 0;
  const nvaMaintenancePct = combinedSpend > 0 ? maintenanceTotal / combinedSpend : 0;

  const allocationValues = Object.values(allocationTotals).sort((a, b) => b - a);
  const top2Share = allocationSum
    ? sum(allocationValues.slice(0, 2)) / allocationSum
    : 0;
  const top4Share = allocationSum
    ? sum(allocationValues.slice(0, 4)) / allocationSum
    : 0;

  const cycleAllocationCounts: Record<string, number> = {};
  decisions.forEach((decision) => {
    Object.entries(decision.allocations || {}).forEach(([activityId, value]) => {
      if (value > 0) {
        cycleAllocationCounts[activityId] =
          (cycleAllocationCounts[activityId] || 0) + 1;
      }
    });
  });
  const stabilityCount = Object.values(cycleAllocationCounts).filter(
    (count) => count >= 3
  ).length;

  return {
    valueCreatingPct,
    valueSupportingPct,
    nvaMaintenancePct,
    top2Share,
    top4Share,
    stabilityCount,
  };
}

function getDecisionTimeline(decisions: Decision[]): TimelineEntry[] {
  const sorted = [...decisions].sort((a, b) => a.cycle - b.cycle);
  const timeline: TimelineEntry[] = [];
  let previousAllocations: Record<string, number> = {};

  sorted.forEach((decision) => {
    const currentAllocations = decision.allocations || {};
    const deltas: { activityId: string; delta: number }[] = [];

    Object.entries(currentAllocations).forEach(([activityId, value]) => {
      const prevValue = previousAllocations[activityId] || 0;
      deltas.push({ activityId, delta: value - prevValue });
    });

    Object.entries(previousAllocations).forEach(([activityId, prevValue]) => {
      if (currentAllocations[activityId] === undefined) {
        deltas.push({ activityId, delta: 0 - prevValue });
      }
    });

    const majorAdds = deltas
      .filter((entry) => entry.delta > 0)
      .sort((a, b) => b.delta - a.delta)
      .slice(0, 3)
      .map((entry) => {
        const def = ALL_ACTIVITIES.find((activity) => activity.id === entry.activityId);
        return `${def?.name || entry.activityId} (+$${entry.delta.toFixed(1)}M)`;
      });

    const reallocationIntensity = sum(deltas.map((entry) => Math.abs(entry.delta)));

    timeline.push({
      cycle: decision.cycle,
      majorAdds,
      majorCuts: decision.cuts?.length
        ? decision.cuts.map((cutId) => {
            const def = ALL_ACTIVITIES.find((activity) => activity.id === cutId);
            return def?.name || cutId;
          })
        : ['None'],
      reallocationIntensity,
    });

    previousAllocations = currentAllocations;
  });

  return timeline;
}

interface InstructorScorecardProps {
  teams: Team[];
  rankings: TeamRanking[];
  decisions: Decision[];
}

export function InstructorScorecard({ teams, rankings, decisions }: InstructorScorecardProps) {
  const decisionsByTeam = new Map<string, Decision[]>();
  teams.forEach((team) => {
    decisionsByTeam.set(
      team.id,
      decisions.filter((decision) => decision.teamId === team.id)
    );
  });

  const contributions = teams.map((team) => ({
    teamId: team.id,
    totals: getTeamContributions(team),
  }));

  const baseRank = computeOrdinalRanks(
    contributions.map((entry) => ({ teamId: entry.teamId, value: entry.totals.base }))
  );
  const linkageRank = computeOrdinalRanks(
    contributions.map((entry) => ({ teamId: entry.teamId, value: entry.totals.linkage }))
  );
  const nvaRank = computeOrdinalRanks(
    contributions.map((entry) => ({ teamId: entry.teamId, value: entry.totals.nvaDrag })),
    false
  );

  const prompts = [
    'What changed structurally after Cycle 2?',
    'Which teams improved without increasing total spend?',
    'Which patterns appear stable across multiple teams?',
  ];

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h3 className="text-xl font-semibold text-white">A — Final Outcome Snapshot</h3>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
          <div className="grid grid-cols-1 gap-4">
            {rankings.map((ranking) => {
              const team = teams.find((item) => item.id === ranking.teamId);
              if (!team) return null;
              return (
                <details
                  key={team.id}
                  className="rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3"
                >
                  <summary className="flex cursor-pointer items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-slate-400">#{ranking.rank}</span>
                      <span className="font-semibold text-white">{team.name}</span>
                      <span className="text-xs text-slate-400">
                        {getPercentileBucket(ranking.rank, rankings.length)}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-white">
                        {team.cas > 0 ? '+' : ''}
                        {team.cas.toFixed(1)} CAS
                      </div>
                    </div>
                  </summary>
                  <div className="mt-3 grid grid-cols-3 gap-3 text-xs text-slate-300">
                    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                      Base Contribution Rank
                      <div className="mt-1 text-sm font-semibold text-white">
                        #{baseRank.get(team.id)}
                      </div>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                      Linkage Contribution Rank
                      <div className="mt-1 text-sm font-semibold text-white">
                        #{linkageRank.get(team.id)}
                      </div>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                      NVA Drag Rank
                      <div className="mt-1 text-sm font-semibold text-white">
                        #{nvaRank.get(team.id)}
                      </div>
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
        </div>
      </section>

      <p className="text-xs text-slate-400">{prompts[0]}</p>

      <section className="space-y-4">
        <h3 className="text-xl font-semibold text-white">B — CAS Trajectory Over Time</h3>
        <div className="space-y-4">
          {teams.map((team) => (
            <div
              key={team.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200"
            >
              <div className="mb-3 text-sm font-semibold text-white">{team.name}</div>
              <div className="grid gap-2 text-xs">
                <div className="grid grid-cols-6 gap-2 text-slate-400">
                  <span>Cycle</span>
                  <span>CAS Δ</span>
                  <span>Base Δ</span>
                  <span>Linkage Δ</span>
                  <span>Shock Δ</span>
                  <span>NVA Δ</span>
                </div>
                {team.cycleResults.map((result) => {
                  const linkageTotal = sum(Object.values(result.casBreakdown.linkageBonuses));
                  return (
                    <div key={result.cycle} className="grid grid-cols-6 gap-2 text-slate-200">
                      <span>{result.cycle}</span>
                      <span>{formatDelta(result.casChange)}</span>
                      <span>{formatDelta(result.casBreakdown.baseScore)}</span>
                      <span>{formatDelta(linkageTotal)}</span>
                      <span>{formatDelta(result.casBreakdown.shockEffect)}</span>
                      <span>{formatDelta(result.casBreakdown.nvaDrag)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <p className="text-xs text-slate-400">{prompts[1]}</p>

      <section className="space-y-4">
        <h3 className="text-xl font-semibold text-white">C — Investment Structure Summary</h3>
        <div className="space-y-4">
          {teams.map((team) => {
            const teamDecisions = decisionsByTeam.get(team.id) || [];
            const structure = getStructureSummary(team, teamDecisions);
            return (
              <div
                key={team.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200"
              >
                <div className="mb-3 text-sm font-semibold text-white">{team.name}</div>
                <div className="grid gap-2 text-xs">
                  <div className="grid grid-cols-3 gap-2">
                    <span>Value-Creating: {(structure.valueCreatingPct * 100).toFixed(0)}%</span>
                    <span>Value-Supporting: {(structure.valueSupportingPct * 100).toFixed(0)}%</span>
                    <span>NVA Maintenance: {(structure.nvaMaintenancePct * 100).toFixed(0)}%</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span>Top-2 Spend Share: {(structure.top2Share * 100).toFixed(0)}%</span>
                    <span>Top-4 Spend Share: {(structure.top4Share * 100).toFixed(0)}%</span>
                    <span>Stable Activities (≥3 cycles): {structure.stabilityCount}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <p className="text-xs text-slate-400">{prompts[2]}</p>

      <section className="space-y-4">
        <h3 className="text-xl font-semibold text-white">D — Decision Timeline</h3>
        <div className="space-y-4">
          {teams.map((team) => {
            const teamDecisions = decisionsByTeam.get(team.id) || [];
            const timeline = getDecisionTimeline(teamDecisions);
            return (
              <div
                key={team.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200"
              >
                <div className="mb-3 text-sm font-semibold text-white">{team.name}</div>
                <div className="grid gap-2 text-xs">
                  <div className="grid grid-cols-4 gap-2 text-slate-400">
                    <span>Cycle</span>
                    <span>Major Adds</span>
                    <span>Major Cuts</span>
                    <span>Reallocation Intensity</span>
                  </div>
                  {timeline.map((entry) => (
                    <div key={entry.cycle} className="grid grid-cols-4 gap-2">
                      <span>{entry.cycle}</span>
                      <span>{entry.majorAdds.length ? entry.majorAdds.join(' • ') : 'None'}</span>
                      <span>{entry.majorCuts.join(', ')}</span>
                      <span>{entry.reallocationIntensity.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
          Appendix / Export Details
        </div>
        <details className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
          <summary className="cursor-pointer text-sm font-semibold text-white">
            View raw decision exports
          </summary>
          <div className="mt-3 text-xs text-slate-300">
            Use the export tool for the full decision list and data files.
          </div>
        </details>
      </section>
    </div>
  );
}
