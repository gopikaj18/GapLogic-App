import { NextRequest, NextResponse } from 'next/server';
import { getIntentions, createIntention } from '@/lib/firebase-db';
import { getUserFromRequest } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const intentions = await getIntentions(user.id);

    return NextResponse.json({
      intentions,
    });
  } catch (error) {
    console.error('[intentions GET]', error);
    return NextResponse.json({ error: 'Failed to load intentions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      category,
      effortEstimate,
      scheduledTime,
      estimatedDuration,
      date,
    } = body;

    if (!title || !category || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const intention = await createIntention(user.id, {
      title: String(title).trim(),
      category: category as any,
      effortEstimate: Number(effortEstimate) || 3,
      scheduledTime: String(scheduledTime || '09:00'),
      estimatedDuration: Number(estimatedDuration) || 25,
      date: String(date),
    });

    return NextResponse.json({ intention });
  } catch (error) {
    console.error('[intentions POST]', error);
    return NextResponse.json({ error: 'Failed to create intention' }, { status: 500 });
  }
}
