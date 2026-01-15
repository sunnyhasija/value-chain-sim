import { NextRequest, NextResponse } from 'next/server';
import { getPusherServer } from '@/lib/pusher';

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const socketId = data.get('socket_id') as string;
    const channel = data.get('channel_name') as string;

    if (!socketId || !channel) {
      return NextResponse.json(
        { error: 'Missing socket_id or channel_name' },
        { status: 400 }
      );
    }

    // For private channels, we authenticate all requests
    // In production, you might want to add additional validation
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
