import { NextRequest, NextResponse } from 'next/server';
import { getTeamByCode, getSession } from '@/lib/db';
import { updateTeamName } from '@/lib/game-engine';
import { triggerTeamJoined } from '@/lib/pusher';
import { JoinGameRequest, JoinGameResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: JoinGameRequest = await request.json();
    const { code, teamName } = body;

    if (!code) {
      return NextResponse.json({ error: 'Team code is required' }, { status: 400 });
    }

    // Find team by code
    const team = await getTeamByCode(code.toUpperCase());
    if (!team) {
      return NextResponse.json({ error: 'Invalid team code' }, { status: 404 });
    }

    // Get session
    const session = await getSession(team.sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Game session not found' }, { status: 404 });
    }

    if (session.status === 'completed') {
      return NextResponse.json({ error: 'Game has already completed' }, { status: 400 });
    }

    // Update team name if provided
    if (teamName && teamName.trim()) {
      await updateTeamName(team.id, teamName.trim());
      team.name = teamName.trim();
    }

    // Notify other clients
    await triggerTeamJoined(team.sessionId, team.id, team.name);

    const response: JoinGameResponse = {
      teamId: team.id,
      sessionId: team.sessionId,
      team,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error joining game:', error);
    return NextResponse.json(
      { error: 'Failed to join game' },
      { status: 500 }
    );
  }
}
