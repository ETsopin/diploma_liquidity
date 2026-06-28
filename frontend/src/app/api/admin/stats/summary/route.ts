import { NextRequest, NextResponse } from 'next/server';

import { verifyAccessToken } from '@/services/jwt';
import { getSummaryStats } from '@/services/stats';

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
		{ message: 'Доступ запрешен' },
		{ status: 403 }
	);

	const stats = await getSummaryStats();
	return NextResponse.json(stats);
}
