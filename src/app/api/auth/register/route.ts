import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, createUser } from '@/lib/firebase-db';
import {
  hashPassword,
  createSessionForUser,
  setSessionCookie,
  SessionUser,
} from '@/lib/auth-server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await getUserByEmail(normalizedEmail);
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const userId = crypto.randomUUID();
    const newUser = await createUser(userId, normalizedEmail, passwordHash, name);

    const user: SessionUser = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      createdAt: newUser.createdAt,
    };

    const token = await createSessionForUser(user);
    await setSessionCookie(token);

    return NextResponse.json({ user, token });
  } catch (error) {
    console.error('[register]', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
