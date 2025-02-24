import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const tokenCoockie = request.cookies.get('access_token');
    if (!tokenCoockie || !tokenCoockie.value) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    async function verifyToken(token: string) {
        'use server';

        try {
            jwt.verify(token, process.env.JWT_SECRET!);
        } catch (error) {
            console.error(error);
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    await verifyToken(tokenCoockie.value);

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*'],
}; 