import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/services/jwt';
import { getDashboardWithAccess, updateSharing } from '@/services/dashboards';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
	const token = request.cookies.get('accessToken')?.value;
	if (!token) return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });

	const payload = verifyAccessToken(token);
	if (!payload) return NextResponse.json({ message: 'Токен недействителен' }, { status: 401 });

	const result = await getDashboardWithAccess(params.id, payload.userId, payload.role);
	if (!result)
		return NextResponse.json({ message: 'Дашборд не найден' }, { status: 404 });
	if (!result.canEdit)
		return NextResponse.json({ message: 'Нет прав' }, { status: 403 });

	const body = await request.json();
	const updated = await updateSharing(params.id, body.shared_with || []);
	if (!updated)
		return NextResponse.json({ message: 'Ошибка' }, { status: 500 });

	return NextResponse.json(updated);
}
