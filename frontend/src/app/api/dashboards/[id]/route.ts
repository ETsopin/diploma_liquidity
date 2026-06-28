import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/services/jwt';
import { getDashboardWithAccess, updateDashboard, deleteDashboard } from '@/services/dashboards';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
	const token = request.cookies.get('accessToken')?.value;
	if (!token) return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });

	const payload = verifyAccessToken(token);
	if (!payload) return NextResponse.json({ message: 'Токен недействителен' }, { status: 401 });

	const result = await getDashboardWithAccess(params.id, payload.userId, payload.role);
	if (!result)
		return NextResponse.json({ message: 'Дашборд не найден' }, { status: 404 });

	return NextResponse.json(result.dashboard);
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
	const token = request.cookies.get('accessToken')?.value;
	if (!token) return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });

	const payload = verifyAccessToken(token);
	if (!payload) return NextResponse.json({ message: 'Токен недействителен' }, { status: 401 });
	if (payload.role === 'viewer')
		return NextResponse.json({ message: 'Доступ запрещён' }, { status: 403 });

	const result = await getDashboardWithAccess(params.id, payload.userId, payload.role);
	if (!result)
		return NextResponse.json({ message: 'Дашборд не найден' }, { status: 404 });
	if (!result.canEdit)
		return NextResponse.json({ message: 'Нет прав на редактирование' }, { status: 403 });

	const body = await request.json();
	const updated = await updateDashboard(params.id, body);
	if (!updated)
		return NextResponse.json({ message: 'Ошибка обновления' }, { status: 500 });

	return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
	const token = request.cookies.get('accessToken')?.value;
	if (!token) return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });

	const payload = verifyAccessToken(token);
	if (!payload) return NextResponse.json({ message: 'Токен недействителен' }, { status: 401 });

	const result = await getDashboardWithAccess(params.id, payload.userId, payload.role);
	if (!result)
		return NextResponse.json({ message: 'Дашборд не найден' }, { status: 404 });
	if (!result.canEdit)
		return NextResponse.json({ message: 'Нет прав на удаление' }, { status: 403 });

	await deleteDashboard(params.id);
	return NextResponse.json({ message: 'Дашборд удалён' });
}
