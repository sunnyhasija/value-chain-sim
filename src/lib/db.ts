import { v4 as uuidv4 } from 'uuid';
import {
  GameSession,
  Team,
  TeamActivity,
  Decision,
  GameStatus,
  STARTING_REVENUE,
  STARTING_OPERATING_PROFIT,
  STARTING_MARGIN,
  BUDGET_PERCENTAGE,
  DEFAULT_CYCLE_TIME,
} from './types';
import { ALL_ACTIVITIES, getStartingNVAMaintenanceCost } from './activities';
import { localKv } from './local-kv';
import { redisKv } from './redis-kv';

const hasRedis = !!process.env.REDIS_URL;
const kv = hasRedis ? redisKv : localKv;

// Key prefixes for Redis
const KEYS = {
  session: (id: string) => `session:${id}`,
  sessionByCode: (code: string) => `session:code:${code}`,
  team: (id: string) => `team:${id}`,
  teamByCode: (code: string) => `team:code:${code}`,
  teamActivities: (teamId: string) => `team:${teamId}:activities`,
  sessionTeams: (sessionId: string) => `session:${sessionId}:teams`,
  decision: (id: string) => `decision:${id}`,
  teamDecisions: (teamId: string) => `team:${teamId}:decisions`,
  sessionDecisions: (sessionId: string) => `session:${sessionId}:decisions`,
};

// Generate a short, readable code
function generateCode(length: number = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing characters
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Session operations
export async function createSession(createdBy: string, teamCount: number = 8): Promise<{
  session: GameSession;
  teamCodes: { teamNumber: number; code: string }[];
}> {
  const sessionId = uuidv4();
  const instructorCode = generateCode(8);

  const session: GameSession = {
    id: sessionId,
    code: instructorCode,
    status: 'lobby',
    currentCycle: 0,
    cycleStartTime: 0,
    cycleTimeLimit: DEFAULT_CYCLE_TIME,
    shock: null,
    createdAt: Date.now(),
    createdBy,
  };

  // Generate team codes
  const teamCodes: { teamNumber: number; code: string }[] = [];
  for (let i = 1; i <= teamCount; i++) {
    const code = generateCode(6);
    teamCodes.push({ teamNumber: i, code });

    // Create placeholder team
    const team = await createTeam(sessionId, `Team ${i}`, code);

    // Map code to team
    await kv.set(KEYS.teamByCode(code), team.id);
  }

  // Save session
  await kv.set(KEYS.session(sessionId), session);
  await kv.set(KEYS.sessionByCode(instructorCode), sessionId);

  return { session, teamCodes };
}

export async function getSession(sessionId: string): Promise<GameSession | null> {
  return await kv.get<GameSession>(KEYS.session(sessionId));
}

export async function getSessionByCode(code: string): Promise<GameSession | null> {
  const sessionId = await kv.get<string>(KEYS.sessionByCode(code));
  if (!sessionId) return null;
  return await getSession(sessionId);
}

export async function updateSession(session: GameSession): Promise<void> {
  await kv.set(KEYS.session(session.id), session);
}

export async function updateSessionStatus(sessionId: string, status: GameStatus): Promise<void> {
  const session = await getSession(sessionId);
  if (session) {
    session.status = status;
    await updateSession(session);
  }
}

// Team operations
export async function createTeam(sessionId: string, name: string, code: string): Promise<Team> {
  const teamId = uuidv4();
  const startingBudget = STARTING_REVENUE * BUDGET_PERCENTAGE - getStartingNVAMaintenanceCost();

  const team: Team = {
    id: teamId,
    sessionId,
    name,
    code,
    budget: startingBudget,
    cas: 0,
    margin: STARTING_MARGIN,
    revenue: STARTING_REVENUE,
    operatingProfit: STARTING_OPERATING_PROFIT,
    hasSubmitted: false,
    hasSeenBrief: false,
    cycleResults: [],
  };

  // Initialize activities for team
  const activities: TeamActivity[] = ALL_ACTIVITIES.map(def => ({
    activityId: def.id,
    health: def.startingHealth,
    investment: 0,
    isEliminated: false,
  }));

  // Save team and activities
  await kv.set(KEYS.team(teamId), team);
  await kv.set(KEYS.teamActivities(teamId), activities);
  await kv.sadd(KEYS.sessionTeams(sessionId), teamId);

  return team;
}

export async function getTeam(teamId: string): Promise<Team | null> {
  return await kv.get<Team>(KEYS.team(teamId));
}

export async function getTeamByCode(code: string): Promise<Team | null> {
  const teamId = await kv.get<string>(KEYS.teamByCode(code));
  if (!teamId) return null;
  return await getTeam(teamId);
}

export async function updateTeam(team: Team): Promise<void> {
  await kv.set(KEYS.team(team.id), team);
}

export async function getSessionTeams(sessionId: string): Promise<Team[]> {
  const teamIds = await kv.smembers(KEYS.sessionTeams(sessionId)) as string[];
  const teams: Team[] = [];

  for (const teamId of teamIds) {
    const team = await getTeam(teamId);
    if (team) teams.push(team);
  }

  return teams.sort((a, b) => a.name.localeCompare(b.name));
}

// Team activities operations
export async function getTeamActivities(teamId: string): Promise<TeamActivity[]> {
  const activities = await kv.get<TeamActivity[]>(KEYS.teamActivities(teamId));
  return activities || [];
}

export async function updateTeamActivities(teamId: string, activities: TeamActivity[]): Promise<void> {
  await kv.set(KEYS.teamActivities(teamId), activities);
}

// Decision operations
export async function saveDecision(decision: Decision): Promise<void> {
  await kv.set(KEYS.decision(decision.id), decision);
  await kv.rpush(KEYS.teamDecisions(decision.teamId), decision.id);
  await kv.rpush(KEYS.sessionDecisions(decision.sessionId), decision.id);
}

export async function getDecision(decisionId: string): Promise<Decision | null> {
  return await kv.get<Decision>(KEYS.decision(decisionId));
}

export async function getTeamDecisions(teamId: string): Promise<Decision[]> {
  const decisionIds = await kv.lrange(KEYS.teamDecisions(teamId), 0, -1) as string[];
  const decisions: Decision[] = [];

  for (const id of decisionIds) {
    const decision = await getDecision(id);
    if (decision) decisions.push(decision);
  }

  return decisions.sort((a, b) => a.cycle - b.cycle);
}

export async function getSessionDecisions(sessionId: string): Promise<Decision[]> {
  const decisionIds = await kv.lrange(KEYS.sessionDecisions(sessionId), 0, -1) as string[];
  const decisions: Decision[] = [];

  for (const id of decisionIds) {
    const decision = await getDecision(id);
    if (decision) decisions.push(decision);
  }

  return decisions;
}

// Cycle management
export async function advanceCycle(sessionId: string, shock: string | null = null): Promise<void> {
  const session = await getSession(sessionId);
  if (!session) throw new Error('Session not found');

  session.currentCycle += 1;
  session.cycleStartTime = Date.now();
  session.shock = shock;

  if (session.currentCycle === 1) {
    session.status = 'active';
  }

  // Reset submission status for all teams
  const teams = await getSessionTeams(sessionId);
  for (const team of teams) {
    team.hasSubmitted = false;
    await updateTeam(team);
  }

  await updateSession(session);
}

export async function completeGame(sessionId: string): Promise<void> {
  const session = await getSession(sessionId);
  if (!session) throw new Error('Session not found');

  session.status = 'completed';
  await updateSession(session);
}

// Export all session data for analysis
export async function exportSessionData(sessionId: string): Promise<{
  session: GameSession;
  teams: Team[];
  decisions: Decision[];
  teamActivities: Record<string, TeamActivity[]>;
}> {
  const session = await getSession(sessionId);
  if (!session) throw new Error('Session not found');

  const teams = await getSessionTeams(sessionId);
  const decisions = await getSessionDecisions(sessionId);

  const teamActivities: Record<string, TeamActivity[]> = {};
  for (const team of teams) {
    teamActivities[team.id] = await getTeamActivities(team.id);
  }

  return { session, teams, decisions, teamActivities };
}
