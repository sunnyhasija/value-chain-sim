import { v4 as uuidv4 } from 'uuid';
import {
  Team,
  TeamActivity,
  Decision,
  CycleResult,
  GameSession,
  TeamRanking,
  MAX_CYCLES,
  BUDGET_PERCENTAGE,
} from './types';
import {
  getSession,
  getSessionTeams,
  getTeam,
  getTeamActivities,
  updateTeam,
  updateTeamActivities,
  saveDecision,
  updateSession,
  advanceCycle as dbAdvanceCycle,
  completeGame,
} from './db';
import {
  calculateNewHealth,
  calculateCAS,
  calculateNewBudget,
  calculateMarginChange,
  calculateRankings,
  calculateNVAMaintenanceCost,
} from './calculations';
import { getActivityById, NON_VALUE_ADD_ACTIVITIES } from './activities';
import { getShockById } from './shocks';
import { getActiveLinkages, LINKAGES } from './linkages';
import {
  triggerDecisionSubmitted,
  triggerCycleAdvanced,
  triggerGameCompleted,
  triggerStateUpdated,
} from './pusher';

// Submit a team's decisions for the current cycle
export async function submitDecision(
  teamId: string,
  allocations: Record<string, number>,
  cuts: string[]
): Promise<{ success: boolean; error?: string }> {
  const team = await getTeam(teamId);
  if (!team) {
    return { success: false, error: 'Team not found' };
  }

  const session = await getSession(team.sessionId);
  if (!session) {
    return { success: false, error: 'Session not found' };
  }

  if (session.status !== 'active') {
    return { success: false, error: 'Game is not active' };
  }

  if (team.hasSubmitted) {
    return { success: false, error: 'Already submitted for this cycle' };
  }

  const activities = await getTeamActivities(teamId);

  // Validate allocations don't exceed budget
  const totalAllocations = Object.values(allocations).reduce((a, b) => a + b, 0);

  // Calculate elimination costs
  let eliminationCosts = 0;
  for (const activityId of cuts) {
    const def = NON_VALUE_ADD_ACTIVITIES.find(a => a.id === activityId);
    if (def && def.eliminationCost) {
      eliminationCosts += def.eliminationCost;
    }
  }

  const totalSpend = totalAllocations + eliminationCosts;
  if (totalSpend > team.budget + 0.01) { // Small tolerance for floating point
    return { success: false, error: `Spending ($${totalSpend}M) exceeds budget ($${team.budget}M)` };
  }

  // Validate cuts - can't cut already eliminated or non-existent activities
  for (const activityId of cuts) {
    const activity = activities.find(a => a.activityId === activityId);
    if (!activity) {
      return { success: false, error: `Activity ${activityId} not found` };
    }
    if (activity.isEliminated) {
      return { success: false, error: `Activity ${activityId} already eliminated` };
    }
    const def = getActivityById(activityId);
    if (!def || def.category !== 'non-value-add') {
      return { success: false, error: `Cannot eliminate non-NVA activity ${activityId}` };
    }
    // Innovation lab can't be eliminated (trap)
    if (activityId === 'innovation-lab' && def.eliminationCost === undefined) {
      return { success: false, error: 'Innovation Lab cannot be eliminated once started' };
    }
  }

  // Create and save decision
  const decision: Decision = {
    id: uuidv4(),
    teamId,
    sessionId: team.sessionId,
    cycle: session.currentCycle,
    allocations,
    cuts,
    submittedAt: Date.now(),
  };

  await saveDecision(decision);

  // Mark team as submitted
  team.hasSubmitted = true;
  await updateTeam(team);

  // Notify via Pusher
  await triggerDecisionSubmitted(team.sessionId, teamId, team.name);

  return { success: true };
}

// Advance the game to the next cycle
export async function advanceCycle(
  sessionId: string,
  shockId: string | null = null
): Promise<{ success: boolean; error?: string; results?: CycleResult[] }> {
  const session = await getSession(sessionId);
  if (!session) {
    return { success: false, error: 'Session not found' };
  }

  if (session.status === 'completed') {
    return { success: false, error: 'Game already completed' };
  }

  const teams = await getSessionTeams(sessionId);
  const shock = shockId ? getShockById(shockId) ?? null : null;

  // Process results only if this isn't the first cycle
  const results: CycleResult[] = [];

  if (session.currentCycle > 0) {
    // Gather all team data
    const teamData: {
      id: string;
      activities: TeamActivity[];
      allocations: Record<string, number>;
      cuts: string[];
    }[] = [];

    for (const team of teams) {
      const activities = await getTeamActivities(team.id);

      // Get this cycle's decision (if any)
      // For teams that didn't submit, use empty allocations
      const allocations: Record<string, number> = {};
      const cuts: string[] = [];

      // Find the decision for this cycle
      const { getTeamDecisions } = await import('./db');
      const decisions = await getTeamDecisions(team.id);
      const cycleDecision = decisions.find(d => d.cycle === session.currentCycle);

      if (cycleDecision) {
        Object.assign(allocations, cycleDecision.allocations);
        cuts.push(...cycleDecision.cuts);
      }

      teamData.push({ id: team.id, activities, allocations, cuts });
    }

    // Calculate new health for all teams
    const allUpdatedActivities: Record<string, TeamActivity[]> = {};

    for (const data of teamData) {
      // Apply cuts
      let activities = data.activities.map(a => {
        if (data.cuts.includes(a.activityId)) {
          return { ...a, isEliminated: true, eliminatedInCycle: session.currentCycle };
        }
        return a;
      });

      // Calculate new health
      activities = calculateNewHealth(activities, data.allocations, shock);
      allUpdatedActivities[data.id] = activities;
    }

    // Calculate CAS for all teams
    const allTeamsActivities = Object.values(allUpdatedActivities);

    for (const data of teamData) {
      const activities = allUpdatedActivities[data.id];
      const team = teams.find(t => t.id === data.id)!;

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

      // Calculate new budget
      const newBudget = calculateNewBudget(team.revenue, casResult.total, activities);

      const result: CycleResult = {
        teamId: data.id,
        cycle: session.currentCycle,
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
        newBudget,
        rank: 0,
      };

      results.push(result);

      // Update team
      team.cas += casResult.total;
      team.margin += result.marginChange;
      team.budget = newBudget;
      team.cycleResults.push(result);

      await updateTeam(team);
      await updateTeamActivities(data.id, activities);
    }

    // Sort and assign ranks
    results.sort((a, b) => b.casChange - a.casChange);
    results.forEach((result, index) => {
      result.rank = index + 1;
    });
  }

  // Advance to next cycle (shocks apply only once)
  await dbAdvanceCycle(sessionId, null);

  // Check if game is now complete
  const updatedSession = await getSession(sessionId);
  if (updatedSession && updatedSession.currentCycle > MAX_CYCLES) {
    await completeGame(sessionId);

    // Get final rankings
    const finalTeams = await getSessionTeams(sessionId);
    const rankings = calculateRankings(
      finalTeams.map(t => ({ id: t.id, name: t.name, cas: t.cas, hasSubmitted: t.hasSubmitted }))
    );

    await triggerGameCompleted(sessionId, rankings);
  } else {
    // Notify cycle advanced
    await triggerCycleAdvanced(sessionId, updatedSession?.currentCycle || 1, null);
  }

  return { success: true, results };
}

// Get current game state for a team
export async function getTeamGameState(teamId: string): Promise<{
  team: Team;
  activities: TeamActivity[];
  session: GameSession;
  rankings: TeamRanking[];
} | null> {
  const team = await getTeam(teamId);
  if (!team) return null;

  const session = await getSession(team.sessionId);
  if (!session) return null;

  const activities = await getTeamActivities(teamId);

  const allTeams = await getSessionTeams(team.sessionId);
  const rankings = calculateRankings(
    allTeams.map(t => ({ id: t.id, name: t.name, cas: t.cas, hasSubmitted: t.hasSubmitted }))
  );

  return { team, activities, session, rankings };
}

// Get current game state for instructor
export async function getInstructorGameState(sessionId: string): Promise<{
  session: GameSession;
  teams: Team[];
  teamActivities: Record<string, TeamActivity[]>;
  rankings: TeamRanking[];
} | null> {
  const session = await getSession(sessionId);
  if (!session) return null;

  const teams = await getSessionTeams(sessionId);

  const teamActivities: Record<string, TeamActivity[]> = {};
  for (const team of teams) {
    teamActivities[team.id] = await getTeamActivities(team.id);
  }

  const rankings = calculateRankings(
    teams.map(t => ({ id: t.id, name: t.name, cas: t.cas, hasSubmitted: t.hasSubmitted }))
  );

  return { session, teams, teamActivities, rankings };
}

// Mark team as having seen the company brief
export async function markBriefSeen(teamId: string): Promise<void> {
  const team = await getTeam(teamId);
  if (team) {
    team.hasSeenBrief = true;
    await updateTeam(team);
  }
}

// Update team name
export async function updateTeamName(teamId: string, name: string): Promise<void> {
  const team = await getTeam(teamId);
  if (team) {
    team.name = name;
    await updateTeam(team);
    await triggerStateUpdated(team.sessionId);
  }
}

// Activate innovation lab (trap)
export async function activateInnovationLab(teamId: string): Promise<{ success: boolean; error?: string }> {
  const team = await getTeam(teamId);
  if (!team) {
    return { success: false, error: 'Team not found' };
  }

  const activities = await getTeamActivities(teamId);
  const innovationLab = activities.find(a => a.activityId === 'innovation-lab');

  if (!innovationLab) {
    return { success: false, error: 'Innovation lab not found' };
  }

  if (innovationLab.health > 0) {
    return { success: false, error: 'Innovation lab already active' };
  }

  // Activate it (it can never be eliminated)
  innovationLab.health = 100;
  await updateTeamActivities(teamId, activities);

  return { success: true };
}
