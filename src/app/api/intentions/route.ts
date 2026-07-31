import { NextRequest, NextResponse } from 'next/server';
import { getIntentions, createIntention, updateIntention, deleteIntention } from '@/lib/firebase-db';
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
      why,
      confidence,
      priority,
      identity,
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
      why: why ? String(why).trim() : '',
      confidence: confidence !== undefined ? Number(confidence) : 100,
      priority: priority || 'medium',
      identity: identity ? String(identity).trim() : '',
      snoozeCount: 0,
      skipped: false,
      skipReason: '',
      distraction: '',
      status: 'scheduled',
    });

    return NextResponse.json({ intention });
  } catch (error) {
    console.error('[intentions POST]', error);
    return NextResponse.json({ error: 'Failed to create intention' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing intention ID' }, { status: 400 });
    }

    const intention = await updateIntention(user.id, id, updates);

    return NextResponse.json({ intention });
  } catch (error) {
    console.error('[intentions PATCH]', error);
    return NextResponse.json({ error: 'Failed to update intention' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing intention ID' }, { status: 400 });
    }

    await deleteIntention(user.id, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[intentions DELETE]', error);
    return NextResponse.json({ error: 'Failed to delete intention' }, { status: 500 });
  }
}

