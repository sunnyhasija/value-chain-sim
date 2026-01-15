import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTeamGameState, getInstructorGameState, markBriefSeen } from '@/lib/game-engine';
import { getShockById } from '@/lib/shocks';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    const sessionId = searchParams.get('sessionId');
    const markSeen = searchParams.get('markSeen') === 'true';

    // Team view
    if (teamId) {
      const state = await getTeamGameState(teamId);
      if (!state) {
        return NextResponse.json({ error: 'Team not found' }, { status: 404 });
      }

      // Mark brief as seen if requested
      if (markSeen && !state.team.hasSeenBrief) {
        await markBriefSeen(teamId);
        state.team.hasSeenBrief = true;
      }

      // Get shock details if there's an active shock
      const currentShock = state.session.shock
        ? getShockById(state.session.shock)
        : null;

      return NextResponse.json({
        ...state,
        currentShock,
      });
    }

    // Instructor view
    if (sessionId) {
      const authSession = await getServerSession(authOptions);
      if (!authSession?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const state = await getInstructorGameState(sessionId);
      if (!state) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      // Get shock details if there's an active shock
      const currentShock = state.session.shock
        ? getShockById(state.session.shock)
        : null;

      return NextResponse.json({
        ...state,
        currentShock,
      });
    }

    return NextResponse.json(
      { error: 'Team ID or Session ID is required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error getting game state:', error);
    return NextResponse.json(
      { error: 'Failed to get game state' },
      { status: 500 }
    );
  }
}
