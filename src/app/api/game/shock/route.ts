import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSession, updateSession } from '@/lib/db';
import { triggerShockAnnounced } from '@/lib/pusher';
import { getAllShocks, getShockById, getSuggestedShocksForCycle } from '@/lib/shocks';

// GET - List available shocks
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cycle = searchParams.get('cycle');

    if (cycle) {
      const suggested = getSuggestedShocksForCycle(parseInt(cycle));
      return NextResponse.json({ shocks: suggested });
    }

    return NextResponse.json({ shocks: getAllShocks() });
  } catch (error) {
    console.error('Error getting shocks:', error);
    return NextResponse.json(
      { error: 'Failed to get shocks' },
      { status: 500 }
    );
  }
}

// POST - Inject a shock into the game
export async function POST(request: NextRequest) {
  try {
    const authSession = await getServerSession(authOptions);
    if (!authSession?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, shockId } = body;

    if (!sessionId || !shockId) {
      return NextResponse.json(
        { error: 'Session ID and Shock ID are required' },
        { status: 400 }
      );
    }

    const gameSession = await getSession(sessionId);
    if (!gameSession) {
      return NextResponse.json({ error: 'Game session not found' }, { status: 404 });
    }

    const shock = getShockById(shockId);
    if (!shock) {
      return NextResponse.json({ error: 'Shock not found' }, { status: 404 });
    }

    // Update session with shock
    gameSession.shock = shockId;
    await updateSession(gameSession);

    // Notify all teams
    await triggerShockAnnounced(sessionId, shock);

    return NextResponse.json({ success: true, shock });
  } catch (error) {
    console.error('Error injecting shock:', error);
    return NextResponse.json(
      { error: 'Failed to inject shock' },
      { status: 500 }
    );
  }
}
