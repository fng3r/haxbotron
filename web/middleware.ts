import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { verifyToken } from './lib/auth/jwt';

export async function middleware(request: NextRequest) {
  const tokenCoockie = request.cookies.get('access_token');
  if (!tokenCoockie || !tokenCoockie.value) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const user = await verifyToken(tokenCoockie.value);
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (request.nextUrl.pathname.startsWith('/api')) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-api-key', process.env.CORE_API_KEY!);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
};
