import { NextRequest, NextResponse } from 'next/server';

import { verifyAccessToken } from '@/services/jwt';
import { findAllUsers, findUserByEmail, createUser } from '@/services/auth';
import { getRequestMeta, logAction } from '@/services/logger';

import bcrypt from 'bcrypt';


export async function GET(request: NextRequest) {
	const token = request.cookies.get('accessToken')?.value;
	if (!token) return NextResponse.json({message: 'Не авторизован'}, { status: 401 });

	const payload = verifyAccessToken(token);
	if (!payload) return NextResponse.json({message: 'Токен недействителен'}, { status: 401 });

	if (payload.role !== 'admin') return NextResponse.json({ message: 'Доступ запрещен' }, { status: 403 });

	const { searchParams } = new URL(request.url);
	const limit = Math.min(Number(searchParams.get('limit')) || 50, 100);
	const offset = Number(searchParams.get('offset')) || 0;

	const result = await findAllUsers(limit, offset);
	return NextResponse.json(result);
};

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('accessToken')?.value;
    if (!token) return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload) return NextResponse.json({ message: 'Токен недействителен' }, { status: 401 });
    if (payload.role !== 'admin') return NextResponse.json({ message: 'Доступ запрещён' }, { status: 403 });

    const body = await request.json();
    const { email, password, first_name, middle_name, last_name, role } = body;

    if (!email || !password || !first_name || !last_name) {
      return NextResponse.json(
        { message: 'Email, пароль, имя и фамилия обязательны' },
        { status: 400 }
      );
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { message: 'Пользователь с таким email уже существует' },
        { status: 409 }
      );
    }

    const password_hash = await bcrypt.hash(password, 12);
    const created = await createUser({ email, password_hash, first_name, middle_name, last_name, role: role || 'viewer' });

	const meta = getRequestMeta(request);
	logAction({
		userId: payload.userId,
		email: payload.email,
		role: payload.role,
		action: 'user_create',
		entity: 'user',
		entityId: String(created._id),
		status: 'success',
		ip: meta.ip,
		userAgent: meta.userAgent,
		details: { email, first_name, last_name, role },
	}).catch(err => console.error('Log create user error:', err));

    const { password_hash: _, refresh_token, sessions, ...safeUser } = created;
    return NextResponse.json(safeUser, { status: 201 });

  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ message: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
