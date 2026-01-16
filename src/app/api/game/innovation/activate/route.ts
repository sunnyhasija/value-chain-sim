import { NextRequest, NextResponse } from 'next/server';
import { activateInnovationLab } from '@/lib/game-engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teamId } = body;

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    const result = await activateInnovationLab(teamId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error activating Innovation Lab:', error);
    return NextResponse.json(
      { error: 'Failed to activate Innovation Lab' },
      { status: 500 }
    );
  }
}
