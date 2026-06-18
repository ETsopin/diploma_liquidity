import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicRoutes = ['/auth', '/api/auth', '/api/health'];

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	const token = request.cookies.get('accessToken')?.value;
	console.log('Middleware check:', { pathname, hasToken: !!token });

	if (publicRoutes.some((route) => pathname.startsWith(route))) {
		if (pathname === '/auth' && token){
			console.log('Redirect from /auth to /')
			return NextResponse.redirect(new URL('/', request.url));	
		}
		return NextResponse.next();
	}

	if (!token) {
		console.log('Redirect to: /auth (no token provided)');
		return NextResponse.redirect(new URL('/auth', request.url));
	}

	console.log('Token accepted');
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
