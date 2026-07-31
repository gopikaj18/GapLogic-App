import { NextRequest, NextResponse } from 'next/server';
import { getRecoveryState, updateRecoveryState } from '@/lib/firebase-db';
import { getUserFromRequest } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    let state = await getRecoveryState(user.id);
    if (!state) {
      state = await updateRecoveryState(user.id, {
        userId: user.id,
        currentStreak: 0,
        recoveryScore: 100,
        recoveryStreak: 0,
        lastUpdated: new Date().toISOString(),
      });
    }
    return NextResponse.json({ recoveryState: state });
  } catch (error) {
    console.error('[recovery GET]', error);
    return NextResponse.json({ error: 'Failed to get recovery state' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    const state = await updateRecoveryState(user.id, body);
    return NextResponse.json({ recoveryState: state });
  } catch (error) {
    console.error('[recovery POST]', error);
    return NextResponse.json({ error: 'Failed to update recovery state' }, { status: 500 });
  }
}
