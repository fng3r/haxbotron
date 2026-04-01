import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { verifyToken } from './lib/auth/jwt';

export async function proxy(request: NextRequest) {
  const tokenCoockie = request.cookies.get('access_token');
  if (!tokenCoockie || !tokenCoockie.value) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const user = await verifyToken(tokenCoockie.value);
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
};
