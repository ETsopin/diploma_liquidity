import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicRoutes = ['/auth', '/api/auth', '/api/auth/validate'];

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	if (publicRoutes.some((route) => pathname.startsWith(route))) {
		const token = request.cookies.get('accessToken')?.value;

		if (pathname === '/auth' && token) {
			return NextResponse.redirect(new URL('/', request.url));
		}

		return NextResponse.next();
	}

	const token = request.cookies.get('accessToken')?.value;

	console.log('Middleware check:', { pathname, hasToken: !!token });

	if (!token) {
		console.log('Redirect to: /auth (No token provided)');
		return NextResponse.redirect(new URL('/auth', request.url));
	}

	console.log('Token provided.');
	return NextResponse.next();
}

export const config = {
	matcher: [
		'/',
		'/auth',
		'/reports/:path*',
		'/core/:path*',
	],
};
