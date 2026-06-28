import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/services/jwt';
import { findAccessibleDashboards, createDashboard } from '@/services/dashboards';

export async function GET(request: NextRequest) {
	const token = request.cookies.get('accessToken')?.value;
	if (!token) return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });

	const payload = verifyAccessToken(token);
	if (!payload) return NextResponse.json({ message: 'Токен недействителен' }, { status: 401 });

	const dashboards = await findAccessibleDashboards(payload.userId, payload.role);
	return NextResponse.json(dashboards);
}

export async function POST(request: NextRequest) {
	const token = request.cookies.get('accessToken')?.value;
	if (!token) return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });

	const payload = verifyAccessToken(token);
	if (!payload) return NextResponse.json({ message: 'Токен недействителен' }, { status: 401 });
	if (payload.role === 'viewer')
		return NextResponse.json({ message: 'Доступ запрещён' }, { status: 403 });

	const body = await request.json();
	if (!body.title)
		return NextResponse.json({ message: 'Название обязательно' }, { status: 400 });

	const dashboard = await createDashboard(
		{ title: body.title, description: body.description, template_slug: body.template_slug },
		payload.userId,
		payload.email
	);

	return NextResponse.json(dashboard, { status: 201 });
}
