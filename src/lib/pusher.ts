import Pusher from 'pusher';
import PusherClient from 'pusher-js';
import { ShockDefinition, TeamRanking } from './types';

// Server-side Pusher instance
let pusherServer: Pusher | null = null;

export function getPusherServer(): Pusher {
  if (!pusherServer) {
    pusherServer = new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.PUSHER_CLUSTER!,
      useTLS: true,
    });
  }
  return pusherServer;
}

// Client-side Pusher instance (singleton)
let pusherClient: PusherClient | null = null;

export function getPusherClient(): PusherClient {
  if (typeof window === 'undefined') {
    throw new Error('Pusher client can only be used in browser');
  }

  if (!pusherClient) {
    pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: '/api/pusher/auth',
    });
  }
  return pusherClient;
}

// Channel naming
export function getSessionChannel(sessionId: string): string {
  return `private-session-${sessionId}`;
}

export function getTeamChannel(teamId: string): string {
  return `private-team-${teamId}`;
}

// Event types
export const EVENTS = {
  TEAM_JOINED: 'team-joined',
  DECISION_SUBMITTED: 'decision-submitted',
  CYCLE_ADVANCED: 'cycle-advanced',
  SHOCK_ANNOUNCED: 'shock-announced',
  GAME_COMPLETED: 'game-completed',
  STATE_UPDATED: 'state-updated',
} as const;

// Server-side event triggers
export async function triggerTeamJoined(
  sessionId: string,
  teamId: string,
  teamName: string
): Promise<void> {
  const pusher = getPusherServer();
  await pusher.trigger(getSessionChannel(sessionId), EVENTS.TEAM_JOINED, {
    teamId,
    teamName,
  });
}

export async function triggerDecisionSubmitted(
  sessionId: string,
  teamId: string,
  teamName: string
): Promise<void> {
  const pusher = getPusherServer();
  await pusher.trigger(getSessionChannel(sessionId), EVENTS.DECISION_SUBMITTED, {
    teamId,
    teamName,
  });
}

export async function triggerCycleAdvanced(
  sessionId: string,
  cycle: number,
  shock: ShockDefinition | null
): Promise<void> {
  const pusher = getPusherServer();
  await pusher.trigger(getSessionChannel(sessionId), EVENTS.CYCLE_ADVANCED, {
    cycle,
    shock,
  });
}

export async function triggerShockAnnounced(
  sessionId: string,
  shock: ShockDefinition
): Promise<void> {
  const pusher = getPusherServer();
  await pusher.trigger(getSessionChannel(sessionId), EVENTS.SHOCK_ANNOUNCED, {
    shock,
  });
}

export async function triggerGameCompleted(
  sessionId: string,
  rankings: TeamRanking[]
): Promise<void> {
  const pusher = getPusherServer();
  await pusher.trigger(getSessionChannel(sessionId), EVENTS.GAME_COMPLETED, {
    rankings,
  });
}

export async function triggerStateUpdated(sessionId: string): Promise<void> {
  const pusher = getPusherServer();
  await pusher.trigger(getSessionChannel(sessionId), EVENTS.STATE_UPDATED, {
    timestamp: Date.now(),
  });
}

// Notify a specific team
export async function notifyTeam(
  teamId: string,
  event: string,
  data: Record<string, unknown>
): Promise<void> {
  const pusher = getPusherServer();
  await pusher.trigger(getTeamChannel(teamId), event, data);
}
