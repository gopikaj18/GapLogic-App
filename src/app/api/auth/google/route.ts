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
    const { email, name } = await req.json();

    if (!email || !name) {
      return NextResponse.json({ error: 'Email and Name are required' }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Check if user exists in the database
    let userRecord = await getUserByEmail(normalizedEmail);

    if (!userRecord) {
      // User doesn't exist, register them automatically
      // Generate a secure, random placeholder password to satisfy the constraint
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const passwordHash = await hashPassword(randomPassword);
      const userId = crypto.randomUUID();
      userRecord = await createUser(userId, normalizedEmail, passwordHash, name);
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
    console.error('[google-auth]', error);
    return NextResponse.json({ error: 'Google authentication failed' }, { status: 500 });
  }
}
