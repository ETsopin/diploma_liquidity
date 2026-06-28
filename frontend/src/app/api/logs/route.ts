import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/services/jwt';
import { logAction, getRequestMeta } from '@/services/logger';

export async function POST(request: NextRequest) {
	try {
		const token = request.cookies.get('accessToken')?.value;
		if (!token) return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
		
		const payload = verifyAccessToken(token);
		if (!payload) return NextResponse.json({ message: 'Токен недействителен' }, { status: 401 });
		
		const body = await request.json();
		const { action, entity, entity_id, status, details, error } = body;
		
		if (!action) {
			return NextResponse.json({ message: 'action обязателен' }, { status: 400 });
		}
		
		const meta = getRequestMeta(request);
		await logAction({
			userId: payload.userId,
			email: payload.email,
			role: payload.role,
			action,
			entity: entity || null,
			entityId: entity_id || null,
			status: status || 'success',
			ip: meta.ip,
			userAgent: meta.userAgent,
			details: details || null,
			error: error || null,
		});
		
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Log action error:', error);
		return NextResponse.json({ message: 'Внутренняя ошибка сервера' }, { status: 500 });
	}
}
