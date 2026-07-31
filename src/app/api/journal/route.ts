import { NextRequest, NextResponse } from 'next/server';
import { getJournalEntries, createJournalEntry } from '@/lib/firebase-db';
import { getUserFromRequest } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const entries = await getJournalEntries(user.id);
    return NextResponse.json({ entries });
  } catch (error) {
    console.error('[journal GET]', error);
    return NextResponse.json({ error: 'Failed to get journal entries' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    const { date, content, gratitude, lessons, wins, mood } = body;
    if (!date || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const entry = await createJournalEntry(user.id, {
      date,
      content,
      gratitude: gratitude || '',
      lessons: lessons || '',
      wins: wins || '',
      mood: Number(mood) || 3,
    });
    return NextResponse.json({ entry });
  } catch (error) {
    console.error('[journal POST]', error);
    return NextResponse.json({ error: 'Failed to save journal entry' }, { status: 500 });
  }
}
