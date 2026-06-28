import { NextRequest, NextResponse } from 'next/server';

import { verifyAccessToken } from '@/services/jwt';
import { getTimeline } from '@/services/stats';

export async function GET(request: NextRequest) {
	const token = request.cookies.get('accessToken')?.value;
	if (!token) return NextResponse.json(
		{ message: 'Не авторизован' }, 
		{ status: 401 }
	);

	const payload = verifyAccessToken(token);
	if (!payload) return NextResponse.json(
		{ message: 'Токен недействителен' },
   		{ status: 401 }
	);

	if (payload.role !== 'admin') return NextResponse.json(
		{ message: 'Доступ запрещён' },
   		{ status: 403 }
	);

	const { searchParams } = new URL(request.url);
	const days = Math.min(Math.max(Number(searchParams.get('days')) || 30, 1), 365);

	const items = await getTimeline(days);
	return NextResponse.json({ items });
}
