import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { getUserById } from './firebase-db';
import { createToken, getTokenPayload } from './auth-jwt';

import { COOKIE_NAME } from './auth-jwt';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionForUser(user: SessionUser): Promise<string> {
  return createToken({
    sub: user.id,
    email: user.email,
    name: user.name,
  });
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  const payload = await getTokenPayload(token);
  if (!payload?.sub) return null;

  const user = await getUserById(payload.sub);
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  };
}

export function sessionCookieOptions(maxAge = 60 * 60 * 24 * 7) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, sessionCookieOptions());
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getUserFromRequest(req: NextRequest): Promise<SessionUser | null> {
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return verifyToken(authHeader.slice(7));
  }

  const cookieToken = req.cookies.get(COOKIE_NAME)?.value;
  if (cookieToken) {
    return verifyToken(cookieToken);
  }

  return null;
}

export { COOKIE_NAME } from './auth-jwt';
