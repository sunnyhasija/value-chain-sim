import {
  TeamActivity,
  CycleResult,
  ShockDefinition,
  BUDGET_PERCENTAGE,
  ActivityDefinition,
} from './types';
import {
  getActivityById,
  VALUE_CREATING_ACTIVITIES,
  NON_VALUE_ADD_ACTIVITIES,
} from './activities';
import {
  getActiveLinkages,
  calculateLinkageBonus,
  getDecayModifier,
  hasShockImmunity,
  LINKAGES,
  isLinkageActive,
} from './linkages';
import { calculateShockImpact, getShockById } from './shocks';

// Investment effectiveness - how much health is gained per $1M invested
const BASE_INVESTMENT_EFFECTIVENESS = 2; // 2 health points per $1M

// Calculate health changes from investments
export function calculateHealthFromInvestment(
  activityId: string,
  investment: number,
  currentHealth: number,
  activityHealth: Record<string, number>
): number {
  const activity = getActivityById(activityId);
  if (!activity) return 0;

  // Base effectiveness
  let effectiveness = BASE_INVESTMENT_EFFECTIVENESS;

  // Apply linkage bonuses
  const linkageBonus = calculateLinkageBonus(activityId, activityHealth);
  effectiveness *= (1 + linkageBonus);

  // Calculate health gain
  const healthGain = investment * effectiveness;

  // Diminishing returns above 80 health
  if (currentHealth >= 80) {
    return healthGain * 0.5;
  }

  return healthGain;
}

// Calculate health decay for an activity
export function calculateDecay(
  activityId: string,
  currentHealth: number,
  activityHealth: Record<string, number>
): number {
  const activity = getActivityById(activityId);
  if (!activity) return 0;

  // Base decay rate
  let decay = activity.decayRate;

  // Apply linkage decay modifiers
  const decayModifier = getDecayModifier(activityId, activityHealth);
  decay *= decayModifier;

  return decay;
}

// Apply shock effects to activities
export function applyShockEffects(
  activities: TeamActivity[],
  shock: ShockDefinition | null,
  activeLinkageIds: string[]
): TeamActivity[] {
  if (!shock) return activities;

  return activities.map(activity => {
    const impact = calculateShockImpact(shock, activity.activityId, activeLinkageIds);
    if (impact === 0) return activity;

    return {
      ...activity,
      health: Math.max(0, activity.health + impact), // Impact is negative
    };
  });
}

// Calculate new health values after a cycle
export function calculateNewHealth(
  activities: TeamActivity[],
  allocations: Record<string, number>,
  shock: ShockDefinition | null
): TeamActivity[] {
  // Build activity health map
  const activityHealth: Record<string, number> = {};
  activities.forEach(a => {
    activityHealth[a.activityId] = a.health;
  });

  // Get active linkages for shock immunity
  const activeLinkages = getActiveLinkages(activityHealth);
  const activeLinkageIds = activeLinkages.map(l => l.id);

  // Apply shock effects first
  let updatedActivities = applyShockEffects(activities, shock, activeLinkageIds);

  // Update health for each activity
  updatedActivities = updatedActivities.map(activity => {
    if (activity.isEliminated) return activity;

    const def = getActivityById(activity.activityId);
    if (!def) return activity;

    // Skip NVA activities that aren't eliminated
    if (def.category === 'non-value-add') {
      return activity;
    }

    // Calculate decay
    const decay = calculateDecay(activity.activityId, activity.health, activityHealth);

    // Calculate investment gain
    const investment = allocations[activity.activityId] || 0;
    const gain = calculateHealthFromInvestment(
      activity.activityId,
      investment,
      activity.health,
      activityHealth
    );

    // New health = current + gain - decay
    const newHealth = Math.max(0, Math.min(100, activity.health + gain - decay));

    return {
      ...activity,
      health: Math.round(newHealth * 10) / 10, // Round to 1 decimal
      investment,
    };
  });

  return updatedActivities;
}

// Calculate base CAS score from primary activities
export function calculateBaseCAS(
  activities: TeamActivity[],
  allTeamsActivities: TeamActivity[][]
): { score: number; breakdown: Record<string, { team: number; avg: number; diff: number }> } {
  const breakdown: Record<string, { team: number; avg: number; diff: number }> = {};
  let totalScore = 0;

  for (const primaryDef of VALUE_CREATING_ACTIVITIES) {
    const teamActivity = activities.find(a => a.activityId === primaryDef.id);
    if (!teamActivity) continue;

    // Calculate industry average for this activity
    const allHealthValues = allTeamsActivities.map(teamActs => {
      const act = teamActs.find(a => a.activityId === primaryDef.id);
      return act ? act.health : 0;
    });
    const avgHealth = allHealthValues.reduce((a, b) => a + b, 0) / allHealthValues.length;

    // Calculate weighted difference from average
    const diff = teamActivity.health - avgHealth;
    const weightedDiff = diff * (primaryDef.weight || 1);

    breakdown[primaryDef.id] = {
      team: teamActivity.health,
      avg: Math.round(avgHealth * 10) / 10,
      diff: Math.round(weightedDiff * 10) / 10,
    };

    totalScore += weightedDiff;
  }

  return {
    score: Math.round(totalScore * 10) / 10,
    breakdown,
  };
}

// Calculate linkage bonuses for CAS
export function calculateLinkageBonuses(
  activities: TeamActivity[]
): { total: number; bonuses: Record<string, number> } {
  const activityHealth: Record<string, number> = {};
  activities.forEach(a => {
    activityHealth[a.activityId] = a.health;
  });

  const bonuses: Record<string, number> = {};
  let total = 0;

  for (const linkage of LINKAGES) {
    const supportHealth = activityHealth[linkage.supportActivityId] || 0;
    const primaryHealth = activityHealth[linkage.primaryActivityId] || 0;

    if (isLinkageActive(linkage, supportHealth, primaryHealth)) {
      // Linkage bonus for CAS is based on effectiveness bonus
      const casBonus = linkage.effectivenessBonus * 30; // Scale to meaningful CAS points
      bonuses[linkage.id] = Math.round(casBonus * 10) / 10;
      total += casBonus;
    }
  }

  return {
    total: Math.round(total * 10) / 10,
    bonuses,
  };
}

// Calculate NVA drag on CAS
export function calculateNVADrag(activities: TeamActivity[]): { total: number; costs: Record<string, number> } {
  const costs: Record<string, number> = {};
  let total = 0;

  for (const nvaDef of NON_VALUE_ADD_ACTIVITIES) {
    const activity = activities.find(a => a.activityId === nvaDef.id);
    if (!activity) continue;

    // Active NVA activities that aren't eliminated create drag
    if (!activity.isEliminated && nvaDef.startingHealth === 100) {
      const drag = (nvaDef.maintenanceCost || 0) * 0.5; // Convert cost to CAS penalty
      costs[nvaDef.id] = -drag;
      total -= drag;
    }
  }

  return {
    total: Math.round(total * 10) / 10,
    costs,
  };
}

// Calculate shock effect on CAS
export function calculateShockCASEffect(
  activities: TeamActivity[],
  shock: ShockDefinition | null
): number {
  if (!shock) return 0;

  const activityHealth: Record<string, number> = {};
  activities.forEach(a => {
    activityHealth[a.activityId] = a.health;
  });

  const activeLinkages = getActiveLinkages(activityHealth);
  const activeLinkageIds = activeLinkages.map(l => l.id);

  // Check immunity
  const hasImmunity = shock.immunityLinkages.some(id => activeLinkageIds.includes(id));
  if (hasImmunity) {
    return 2; // Bonus for being prepared
  }

  // Penalty for being affected
  return shock.healthImpact * 0.2; // Convert health impact to CAS impact
}

// Calculate full CAS for a team
export function calculateCAS(
  activities: TeamActivity[],
  allTeamsActivities: TeamActivity[][],
  shock: ShockDefinition | null
): {
  total: number;
  baseScore: number;
  linkageBonuses: Record<string, number>;
  shockEffect: number;
  nvaDrag: number;
} {
  const { score: baseScore } = calculateBaseCAS(activities, allTeamsActivities);
  const { total: linkageTotal, bonuses: linkageBonuses } = calculateLinkageBonuses(activities);
  const { total: nvaDrag } = calculateNVADrag(activities);
  const shockEffect = calculateShockCASEffect(activities, shock);

  const total = baseScore + linkageTotal + nvaDrag + shockEffect;

  return {
    total: Math.round(total * 10) / 10,
    baseScore,
    linkageBonuses,
    shockEffect: Math.round(shockEffect * 10) / 10,
    nvaDrag,
  };
}

// Calculate NVA maintenance costs for budget
export function calculateNVAMaintenanceCost(activities: TeamActivity[]): number {
  let total = 0;

  for (const nvaDef of NON_VALUE_ADD_ACTIVITIES) {
    const activity = activities.find(a => a.activityId === nvaDef.id);
    if (!activity) continue;

    // If active and not eliminated, add maintenance cost
    if (!activity.isEliminated && nvaDef.maintenanceCost) {
      total += nvaDef.maintenanceCost;
    }
  }

  return total;
}

// Calculate new budget for next cycle
export function calculateNewBudget(
  revenue: number,
  casChange: number,
  activities: TeamActivity[]
): number {
  const baseBudget = revenue * BUDGET_PERCENTAGE;
  const casAdjustment = casChange * 0.1; // CAS affects budget slightly
  const nvaCosts = calculateNVAMaintenanceCost(activities);

  return Math.max(0, baseBudget + casAdjustment - nvaCosts);
}

// Calculate margin change based on CAS
export function calculateMarginChange(casChange: number): number {
  // Each point of CAS affects margin by 0.05%
  return casChange * 0.05;
}

// Process all cycle results for all teams
export function processCycleResults(
  teams: { id: string; activities: TeamActivity[]; allocations: Record<string, number>; cuts: string[] }[],
  cycle: number,
  shockId: string | null
): CycleResult[] {
  const shock = shockId ? getShockById(shockId) ?? null : null;

  // First, update all activities
  const updatedTeamActivities: Record<string, TeamActivity[]> = {};

  for (const team of teams) {
    // Apply cuts first
    let activities = team.activities.map(a => {
      if (team.cuts.includes(a.activityId)) {
        return { ...a, isEliminated: true, eliminatedInCycle: cycle };
      }
      return a;
    });

    // Then calculate new health
    activities = calculateNewHealth(activities, team.allocations, shock);
    updatedTeamActivities[team.id] = activities;
  }

  // Get all team activities for comparison
  const allTeamsActivities = Object.values(updatedTeamActivities);

  // Calculate results for each team
  const results: CycleResult[] = [];

  for (const team of teams) {
    const activities = updatedTeamActivities[team.id];

    // Calculate CAS
    const casResult = calculateCAS(activities, allTeamsActivities, shock);

    // Get active/orphaned linkages
    const activityHealth: Record<string, number> = {};
    activities.forEach(a => {
      activityHealth[a.activityId] = a.health;
    });
    const activeLinkages = getActiveLinkages(activityHealth).map(l => l.id);
    const orphanedLinkages = LINKAGES
      .filter(l => !activeLinkages.includes(l.id))
      .map(l => l.id);

    // Calculate new health map
    const newHealth: Record<string, number> = {};
    activities.forEach(a => {
      newHealth[a.activityId] = a.health;
    });

    results.push({
      teamId: team.id,
      cycle,
      casChange: casResult.total,
      casBreakdown: {
        baseScore: casResult.baseScore,
        linkageBonuses: casResult.linkageBonuses,
        shockEffect: casResult.shockEffect,
        nvaDrag: casResult.nvaDrag,
        total: casResult.total,
      },
      activeLinkages,
      orphanedLinkages,
      newHealth,
      marginChange: calculateMarginChange(casResult.total),
      newBudget: 0, // Will be calculated per team based on their revenue
      rank: 0, // Will be assigned after sorting
    });
  }

  // Sort by CAS change and assign ranks
  results.sort((a, b) => b.casChange - a.casChange);
  results.forEach((result, index) => {
    result.rank = index + 1;
  });

  return results;
}

// Calculate rankings for all teams
export function calculateRankings(
  teams: { id: string; name: string; cas: number; hasSubmitted: boolean }[]
): { teamId: string; teamName: string; cas: number; rank: number; hasSubmitted: boolean }[] {
  const sorted = [...teams].sort((a, b) => b.cas - a.cas);

  return sorted.map((team, index) => ({
    teamId: team.id,
    teamName: team.name,
    cas: team.cas,
    rank: index + 1,
    hasSubmitted: team.hasSubmitted,
  }));
}
