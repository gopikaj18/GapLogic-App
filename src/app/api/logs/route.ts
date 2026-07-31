import { NextRequest, NextResponse } from 'next/server';
import { getLogs, createLog, getIntentionById } from '@/lib/firebase-db';
import { getUserFromRequest } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const logs = await getLogs(user.id);

    return NextResponse.json({
      logs,
    });
  } catch (error) {
    console.error('[logs GET]', error);
    return NextResponse.json({ error: 'Failed to load logs' }, { status: 500 });
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
      intentionId,
      completed,
      actualEffort,
      frictionNote,
      contextNote,
      date,
      expectedEffort,
      actualEnergy,
      expectedEnergy,
      moodBefore,
      moodAfter,
      distractions,
    } = body;

    if (!intentionId || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const intention = await getIntentionById(user.id, intentionId);
    if (!intention) {
      return NextResponse.json({ error: 'Intention not found' }, { status: 404 });
    }

    const log = await createLog(user.id, {
      intentionId,
      completed: Boolean(completed),
      actualEffort: Number(actualEffort) || 3,
      frictionNote: String(frictionNote || ''),
      contextNote: String(contextNote || ''),
      date: String(date),
      expectedEffort: expectedEffort !== undefined ? Number(expectedEffort) : 3,
      actualEnergy: actualEnergy !== undefined ? Number(actualEnergy) : 3,
      expectedEnergy: expectedEnergy !== undefined ? Number(expectedEnergy) : 3,
      moodBefore: moodBefore ? String(moodBefore) : '',
      moodAfter: moodAfter ? String(moodAfter) : '',
      distractions: distractions ? String(distractions) : '',
    });

    return NextResponse.json({ log });
  } catch (error) {
    console.error('[logs POST]', error);
    return NextResponse.json({ error: 'Failed to create log' }, { status: 500 });
  }
}

