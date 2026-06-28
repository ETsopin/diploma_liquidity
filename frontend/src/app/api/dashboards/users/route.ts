import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/services/jwt';
import { findDashboardUsers } from '@/services/dashboards';

export async function GET(request: NextRequest) {
	const token = request.cookies.get('accessToken')?.value;
	if (!token) return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });

	const payload = verifyAccessToken(token);
	if (!payload) return NextResponse.json({ message: 'Токен недействителен' }, { status: 401 });
	if (payload.role === 'viewer')
		return NextResponse.json({ message: 'Доступ запрещён' }, { status: 403 });

	const users = await findDashboardUsers();
	return NextResponse.json(users);
}
