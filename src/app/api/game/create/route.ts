import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSession } from '@/lib/db';
import { CreateGameRequest, CreateGameResponse, DEFAULT_TEAM_COUNT } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateGameRequest = await request.json();
    const teamCount = body.teamCount || DEFAULT_TEAM_COUNT;

    // Create the game session
    const { session: gameSession, teamCodes } = await createSession(
      session.user.email || 'instructor',
      teamCount
    );

    const response: CreateGameResponse = {
      sessionId: gameSession.id,
      instructorCode: gameSession.code,
      teamCodes,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error creating game:', error);
    return NextResponse.json(
      { error: 'Failed to create game' },
      { status: 500 }
    );
  }
}
