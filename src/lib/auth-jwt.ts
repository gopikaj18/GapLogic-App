import { SignJWT, jwtVerify } from 'jose';

export const COOKIE_NAME = 'gaplogic_session';
const TOKEN_TTL = '7d';

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET is not set in environment variables');
  }
  return new TextEncoder().encode(secret);
}

export async function createToken(payload: {
  sub: string;
  email: string;
  name: string;
}): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(getSecret());
}

export async function isTokenValid(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}

export async function getTokenPayload(
  token: string
): Promise<{ sub: string; email: string; name: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      sub: payload.sub as string,
      email: payload.email as string,
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}
