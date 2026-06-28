import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/services/jwt';
import { findAllLogs } from '@/services/logger';

export async function GET(request: NextRequest) {
	const token = request.cookies.get('accessToken')?.value;
	if (!token) return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
	
	const payload = verifyAccessToken(token);
	if (!payload) return NextResponse.json({ message: 'Токен недействителен' }, { status: 401 });
	if (payload.role !== 'admin') return NextResponse.json({ message: 'Доступ запрещён' }, { status: 403 });
	
	const { searchParams } = new URL(request.url);
	const limit = Math.min(Number(searchParams.get('limit')) || 50, 100);
	const offset = Number(searchParams.get('offset')) || 0;
	const action = searchParams.get('action') || undefined;
	
	const result = await findAllLogs(limit, offset, action);
	return NextResponse.json(result);
}
