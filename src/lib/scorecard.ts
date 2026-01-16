import { Decision, Team, CycleResult, ActivityDefinition } from './types';
import { NON_VALUE_ADD_ACTIVITIES } from './activities';

export interface ScorecardRow {
  teamId: string;
  teamName: string;
  teamCode: string;
  cycle: number;
  casChange: number;
  casTotal: number;
  baseScore: number;
  linkageBonusTotal: number;
  shockEffect: number;
  nvaDrag: number;
  activeLinkageCount: number;
  avgHealth: number;
  avgHealthDelta: number;
  allocationTotal: number;
  eliminationCosts: number;
  spendTotal: number;
  cutsCount: number;
  allocationsByCategory: Record<string, number>;
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function getAllocationsByCategory(
  allocations: Record<string, number>,
  definitions: ActivityDefinition[]
): Record<string, number> {
  const byCategory: Record<string, number> = {};
  for (const [activityId, amount] of Object.entries(allocations)) {
    const def = definitions.find((activity) => activity.id === activityId);
    if (!def) continue;
    byCategory[def.category] = (byCategory[def.category] || 0) + amount;
  }
  return byCategory;
}

function getEliminationCosts(cuts: string[]): number {
  return cuts.reduce((total, activityId) => {
    const def = NON_VALUE_ADD_ACTIVITIES.find((activity) => activity.id === activityId);
    return total + (def?.eliminationCost || 0);
  }, 0);
}

export function buildScorecards(
  teams: Team[],
  decisions: Decision[],
  activityDefinitions: ActivityDefinition[]
): ScorecardRow[] {
  const decisionMap = new Map<string, Decision>();
  decisions.forEach((decision) => {
    decisionMap.set(`${decision.teamId}:${decision.cycle}`, decision);
  });

  const rows: ScorecardRow[] = [];

  teams.forEach((team) => {
    const cycleResults = [...team.cycleResults].sort((a, b) => a.cycle - b.cycle);
    let previousAvgHealth: number | null = null;
    let casRunningTotal = 0;

    cycleResults.forEach((result: CycleResult) => {
      const healthValues = Object.values(result.newHealth || {});
      const avgHealth = healthValues.length ? sum(healthValues) / healthValues.length : 0;
      const avgHealthDelta =
        previousAvgHealth === null ? 0 : avgHealth - previousAvgHealth;
      previousAvgHealth = avgHealth;

      const decision = decisionMap.get(`${team.id}:${result.cycle}`);
      const allocations = decision?.allocations || {};
      const cuts = decision?.cuts || [];

      const allocationTotal = sum(Object.values(allocations));
      const eliminationCosts = getEliminationCosts(cuts);
      const spendTotal = allocationTotal + eliminationCosts;

      const linkageBonusTotal = sum(Object.values(result.casBreakdown.linkageBonuses));
      casRunningTotal += result.casChange;

      rows.push({
        teamId: team.id,
        teamName: team.name,
        teamCode: team.code,
        cycle: result.cycle,
        casChange: result.casChange,
        casTotal: Math.round(casRunningTotal * 10) / 10,
        baseScore: result.casBreakdown.baseScore,
        linkageBonusTotal: Math.round(linkageBonusTotal * 10) / 10,
        shockEffect: result.casBreakdown.shockEffect,
        nvaDrag: result.casBreakdown.nvaDrag,
        activeLinkageCount: result.activeLinkages.length,
        avgHealth: Math.round(avgHealth * 10) / 10,
        avgHealthDelta: Math.round(avgHealthDelta * 10) / 10,
        allocationTotal: Math.round(allocationTotal * 10) / 10,
        eliminationCosts: Math.round(eliminationCosts * 10) / 10,
        spendTotal: Math.round(spendTotal * 10) / 10,
        cutsCount: cuts.length,
        allocationsByCategory: getAllocationsByCategory(allocations, activityDefinitions),
      });
    });
  });

  return rows;
}
