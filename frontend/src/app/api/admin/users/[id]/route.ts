import { NextRequest, NextResponse } from 'next/server';

import { verifyAccessToken } from '@/services/jwt';
import { findUserById, updateUserById, changeUserActivity } from '@/services/auth';

import { getRequestMeta, logAction } from '@/services/logger';

import bcrypt from 'bcrypt';

export async function GET(request: NextRequest, {params} : { params: { id: string }}) {
	const token = request.cookies.get('accessToken')?.value;
	if (!token) return NextResponse.json({ message: 'Не авторизован'}, { status: 401 });

	const payload = verifyAccessToken(token);
	if (!payload) return NextResponse.json({ message: 'Токен недействителен'}, { status: 401 });
	if (payload.role !== 'admin') return NextResponse.json({ message: 'Доступ запрещен' }, { status: 403 });

	const user = await findUserById(params.id);
	if (!user) return NextResponse.json({ message: 'Пользователь не найден' }, { status: 404 });

	const { password_hash, refresh_token, sessions, ...safeUser } = user;
	return NextResponse.json(safeUser);
}

export async function PUT(request: NextRequest, { params } : { params: {id: string } }) {
	try {
		const token = request.cookies.get('accessToken')?.value;
		if (!token) return NextResponse.json({ message: 'Не авторизован'}, { status: 401 });

		const payload = verifyAccessToken(token);
		if (!payload) return NextResponse.json({ message: 'Токен недействителен'}, { status: 401 });
		if (payload.role !== 'admin') return NextResponse.json({ message: 'Доступ запрещен' }, { status: 403 });

		const body = await request.json();
		const { first_name, middle_name, last_name, role, is_active, password } = body;

		const updateData: Record<string, any> = {};
		if (first_name !== undefined) updateData.first_name = first_name;
		if (middle_name !== undefined) updateData.middle_name = middle_name;
		if (last_name !== undefined) updateData.last_name = last_name;
		if (role !== undefined) updateData.role = role;
		if (is_active !== undefined) updateData.is_active = is_active;
		if (password) {
			updateData.password_hash = await bcrypt.hash(password, 12);
		}

		const updated = await updateUserById(params.id, updateData);
		if (!updated) return NextResponse.json( { message: 'Пользователь не найден'}, { status: 404 });

		const { password_hash: _, ...safeDetails } = updateData;

		const meta = getRequestMeta(request);
		logAction({
			userId: payload.userId,
			email: payload.email,
			role: payload.role,
			action: 'user_update',
			entity: 'user',
			entityId: params.id,
			status: 'success',
			ip: meta.ip,
			userAgent: meta.userAgent,
			details: safeDetails,
		}).catch(err => console.error('Log user update error:', err));

		const {password_hash, refresh_token, sessions, ...safeUser } = updated;
		return NextResponse.json(safeUser);
	
	} catch (err) {
		console.error('Update user error:', err);
		return NextResponse.json({ message: 'Внутренняя ошибка сервера' }, { status: 500 });
	}
}

export async function DELETE(request: NextRequest, { params }: { params: {id: string}}) {
	const token = request.cookies.get('accessToken')?.value;
	if (!token) return NextResponse.json({ message: 'Не авторизован'}, { status: 401 });

	const payload = verifyAccessToken(token);
	if (!payload) return NextResponse.json({ message: 'Токен недействителен'}, { status: 401 });
	if (payload.role !== 'admin') return NextResponse.json({ message: 'Доступ запрещен' }, { status: 403 });

	await changeUserActivity(params.id, false);

	const meta = getRequestMeta(request);
	logAction({
		userId: payload.userId,
		email: payload.email,
		role: payload.role,
		action: 'user_delete',
		entity: 'user',
		entityId: params.id,
		status: 'success',
		ip: meta.ip,
		userAgent: meta.userAgent,
	}).catch(err => console.error('Log user deactivate error:', err));

	return NextResponse.json({ message: 'Пользователь деактивирован'});
}
