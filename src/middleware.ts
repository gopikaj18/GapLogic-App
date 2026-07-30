import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isTokenValid, COOKIE_NAME } from '@/lib/auth-jwt';

const PUBLIC_PATHS = ['/login', '/register'];

function withCors(request: NextRequest, response: NextResponse) {
  const origin = request.headers.get('origin');
  const allowedOrigins = [
    'http://localhost',
    'http://localhost:9002',
    'http://localhost:3000'
  ];

  if (origin && (allowedOrigins.includes(origin) || origin.startsWith('http://192.168.'))) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  } else {
    response.headers.set('Access-Control-Allow-Origin', '*');
  }

  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Handle API routes - allow CORS and bypass middleware auth (API routes handle their own auth)
  if (pathname.startsWith('/api')) {
    if (request.method === 'OPTIONS') {
      return withCors(request, new NextResponse(null, { status: 204 }));
    }
    return withCors(request, NextResponse.next());
  }

  // 2. Static assets and public pages
  if (
    pathname.startsWith('/_next') ||
    pathname.includes('.') ||
    PUBLIC_PATHS.includes(pathname)
  ) {
    return NextResponse.next();
  }

  // 3. Protected Page routes — skip server-side auth for Android WebView/localStorage JWT
  // The JWT is stored client-side in localStorage and can't be read by middleware.
  // SessionContext handles client-side redirects to /login when no token is present.
  // API routes enforce auth independently via Authorization: Bearer header.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
