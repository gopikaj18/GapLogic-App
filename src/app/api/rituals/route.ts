import { NextRequest, NextResponse } from 'next/server';
import { getRituals, createRitual, updateRitual, deleteRitual } from '@/lib/firebase-db';
import { getUserFromRequest } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const rituals = await getRituals(user.id);
    return NextResponse.json({ rituals });
  } catch (error) {
    console.error('[rituals GET]', error);
    return NextResponse.json({ error: 'Failed to get rituals' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    if (body.id) {
      const ritual = await updateRitual(user.id, body.id, body);
      return NextResponse.json({ ritual });
    } else {
      const ritual = await createRitual(user.id, body);
      return NextResponse.json({ ritual });
    }
  } catch (error) {
    console.error('[rituals POST]', error);
    return NextResponse.json({ error: 'Failed to save ritual' }, { status: 500 });
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
      return NextResponse.json({ error: 'Missing ritual ID' }, { status: 400 });
    }
    await deleteRitual(user.id, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[rituals DELETE]', error);
    return NextResponse.json({ error: 'Failed to delete ritual' }, { status: 500 });
  }
}
