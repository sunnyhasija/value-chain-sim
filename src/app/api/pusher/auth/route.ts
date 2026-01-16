import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPusherServer } from '@/lib/pusher';
import { getTeam } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const socketId = data.get('socket_id') as string;
    const channel = data.get('channel_name') as string;
    const teamId = (data.get('teamId') as string | null) || null;

    if (!socketId || !channel) {
      return NextResponse.json(
        { error: 'Missing socket_id or channel_name' },
        { status: 400 }
      );
    }

    const isSessionChannel = channel.startsWith('private-session-');
    const isTeamChannel = channel.startsWith('private-team-');

    if (!isSessionChannel && !isTeamChannel) {
      return NextResponse.json(
        { error: 'Invalid channel' },
        { status: 400 }
      );
    }

    const authSession = await getServerSession(authOptions);

    if (isTeamChannel) {
      const channelTeamId = channel.replace('private-team-', '');
      if (!teamId || teamId !== channelTeamId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      const team = await getTeam(teamId);
      if (!team) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    if (isSessionChannel && !authSession?.user) {
      const sessionId = channel.replace('private-session-', '');
      if (!teamId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      const team = await getTeam(teamId);
      if (!team || team.sessionId !== sessionId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    const pusher = getPusherServer();
    const authResponse = pusher.authorizeChannel(socketId, channel);

    return NextResponse.json(authResponse);
  } catch (error) {
    console.error('Error authenticating Pusher:', error);
    return NextResponse.json(
      { error: 'Failed to authenticate' },
      { status: 500 }
    );
  }
}
