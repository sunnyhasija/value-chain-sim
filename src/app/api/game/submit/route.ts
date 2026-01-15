import { NextRequest, NextResponse } from 'next/server';
import { submitDecision } from '@/lib/game-engine';
import { SubmitDecisionRequest } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: SubmitDecisionRequest = await request.json();
    const { teamId, allocations, cuts } = body;

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    const result = await submitDecision(teamId, allocations || {}, cuts || []);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error submitting decision:', error);
    return NextResponse.json(
      { error: 'Failed to submit decision' },
      { status: 500 }
    );
  }
}
