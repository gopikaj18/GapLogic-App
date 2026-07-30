import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/firebase-db';
import {
  verifyPassword,
  createSessionForUser,
  setSessionCookie,
  SessionUser,
} from '@/lib/auth-server';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const userRecord = await getUserByEmail(email);
    if (!userRecord) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const valid = await verifyPassword(password, userRecord.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const user: SessionUser = {
      id: userRecord.id,
      email: userRecord.email,
      name: userRecord.name,
      createdAt: userRecord.createdAt,
    };

    const token = await createSessionForUser(user);
    await setSessionCookie(token);

    return NextResponse.json({ user, token });
  } catch (error) {
    console.error('[login]', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
