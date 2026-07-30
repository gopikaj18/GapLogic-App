import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  return NextResponse.json({ user: user ?? null });
}
