import { NextRequest, NextResponse } from 'next/server';
import { getTrustTransactions, createTrustTransaction } from '@/lib/firebase-db';
import { getUserFromRequest } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const transactions = await getTrustTransactions(user.id);
    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('[trust GET]', error);
    return NextResponse.json({ error: 'Failed to get trust transactions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    const { amount, type, description, date } = body;
    if (amount === undefined || !type || !description || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const transaction = await createTrustTransaction(user.id, {
      amount: Number(amount),
      type,
      description,
      date,
    });
    return NextResponse.json({ transaction });
  } catch (error) {
    console.error('[trust POST]', error);
    return NextResponse.json({ error: 'Failed to save trust transaction' }, { status: 500 });
  }
}
