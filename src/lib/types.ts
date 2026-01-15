// Core type definitions for Value Chain Investment Simulation

export type GameStatus = 'lobby' | 'active' | 'completed';
export type ActivityCategory = 'value-creating' | 'value-supporting' | 'non-value-add';

export interface GameSession {
  id: string;
  code: string;                    // Instructor access code
  status: GameStatus;
  currentCycle: number;            // 1-4
  cycleStartTime: number;          // Timestamp
  cycleTimeLimit: number;          // Seconds (300 default)
  shock: string | null;            // Current cycle shock ID
  createdAt: number;
  createdBy: string;               // Instructor ID
}

export interface Team {
  id: string;
  sessionId: string;
  name: string;
  code: string;                    // Unique team join code
  budget: number;                  // Current available budget (millions)
  cas: number;                     // Cumulative CAS
  margin: number;                  // Operating margin percentage
  revenue: number;                 // Revenue in millions
  operatingProfit: number;         // Operating profit in millions
  hasSubmitted: boolean;           // Current cycle submission status
  hasSeenBrief: boolean;           // Whether team has seen company brief
  cycleResults: CycleResult[];     // History of cycle results
}

export interface ActivityDefinition {
  id: string;
  name: string;
  description: string;
  category: ActivityCategory;
  startingHealth: number;          // 0-100
  decayRate: number;               // Points lost per cycle without investment
  weight?: number;                 // Only for value-creating activities
  maintenanceCost?: number;        // Only for NVA activities (millions)
  eliminationCost?: number;        // Only for NVA activities (millions)
}

export interface TeamActivity {
  activityId: string;
  health: number;                  // Current health 0-100
  investment: number;              // Current cycle allocation (millions)
  isEliminated: boolean;           // For NVA activities
  eliminatedInCycle?: number;      // When was it eliminated
}

export interface Decision {
  id: string;
  teamId: string;
  sessionId: string;
  cycle: number;
  allocations: Record<string, number>;  // activityId -> amount in millions
  cuts: string[];                        // activityIds eliminated this cycle
  submittedAt: number;
}

export interface LinkageDefinition {
  id: string;
  supportActivityId: string;
  primaryActivityId: string;
  supportThreshold: number;        // Required health for support activity
  primaryThreshold: number;        // Required health for primary activity
  effectivenessBonus: number;      // Percentage bonus to primary effectiveness
  decayReduction?: number;         // Percentage reduction in decay rate
  shockImmunity?: boolean;         // Whether this linkage provides shock protection
  description: string;
}

export interface ActiveLinkage {
  linkageId: string;
  supportHealth: number;
  primaryHealth: number;
  bonusApplied: number;
}

export interface CycleResult {
  teamId: string;
  cycle: number;
  casChange: number;
  casBreakdown: {
    baseScore: number;
    linkageBonuses: Record<string, number>;
    shockEffect: number;
    nvaDrag: number;
    total: number;
  };
  activeLinkages: string[];        // Linkage IDs that were active
  orphanedLinkages: string[];      // Linkage IDs that failed threshold
  newHealth: Record<string, number>;
  marginChange: number;
  newBudget: number;
  rank: number;
}

export interface ShockDefinition {
  id: string;
  name: string;
  description: string;
  narrative: string;               // Story text for teams
  affectedActivities: string[];    // Activity IDs affected
  healthImpact: number;            // Negative health impact
  immunityLinkages: string[];      // Linkage IDs that provide immunity
}

export interface GameState {
  session: GameSession;
  teams: Team[];
  teamActivities: Record<string, TeamActivity[]>;  // teamId -> activities
  decisions: Decision[];
  currentShock: ShockDefinition | null;
}

// API request/response types
export interface CreateGameRequest {
  teamCount?: number;              // Default 8
  cycleTimeLimit?: number;         // Default 300 seconds
}

export interface CreateGameResponse {
  sessionId: string;
  instructorCode: string;
  teamCodes: { teamNumber: number; code: string; }[];
}

export interface JoinGameRequest {
  code: string;
  teamName: string;
}

export interface JoinGameResponse {
  teamId: string;
  sessionId: string;
  team: Team;
}

export interface SubmitDecisionRequest {
  teamId: string;
  allocations: Record<string, number>;
  cuts: string[];
}

export interface GameStateResponse {
  session: GameSession;
  team?: Team;
  activities?: TeamActivity[];
  allTeams?: TeamRanking[];        // For instructor view
  currentShock?: ShockDefinition;
}

export interface TeamRanking {
  teamId: string;
  teamName: string;
  cas: number;
  rank: number;
  hasSubmitted: boolean;
}

// Pusher event types
export interface PusherEvents {
  'team-joined': { teamId: string; teamName: string; };
  'decision-submitted': { teamId: string; teamName: string; };
  'cycle-advanced': { cycle: number; shock: ShockDefinition | null; };
  'shock-announced': { shock: ShockDefinition; };
  'game-completed': { rankings: TeamRanking[]; };
  'state-updated': { timestamp: number; };
}

// Constants
export const STARTING_REVENUE = 1000;           // $1 billion
export const STARTING_OPERATING_PROFIT = 50;    // $50 million
export const STARTING_MARGIN = 5;               // 5%
export const BUDGET_PERCENTAGE = 0.05;          // 5% of revenue
export const MAX_CYCLES = 4;
export const DEFAULT_CYCLE_TIME = 300;          // 5 minutes
export const DEFAULT_TEAM_COUNT = 8;
