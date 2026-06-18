import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';

import { findUserByEmail, updateLastLogin, updateRefreshToken } from '@/services/auth';
import { generateAccessToken, generateRefreshToken } from '@/services/jwt';

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { email, password } = body;

		if (!email || !password) {
			return NextResponse.json(
				{ message: 'Email и пароль обязательны' },
				{ status: 400 }
			);
		}

		const user = await findUserByEmail(email);
		if (!user) {
			return NextResponse.json(
				{ message: 'Неверный email или пароль' },
				{ status: 401 }
			);
		}

		if (!user.is_active) {
			return NextResponse.json(
				{ message: 'Учётная запись заблокирована' },
				{ status: 403 }
			);
		}

		const isPasswordValid = await bcrypt.compare(password, user.password_hash);
		if (!isPasswordValid) {
			return NextResponse.json(
				{ message: 'Неверный email или пароль' },
				{ status: 401 }
			);
		}

		const payload = {
			userId: user._id.toString(),
			email: user.email,
			role: user.role,
		};

		const accessToken = generateAccessToken(payload);
		const refreshToken = generateRefreshToken(payload);

		await Promise.all([
			updateLastLogin(email),
			updateRefreshToken(email, refreshToken),
		]);

		const userResponse = {
			_id: user._id,
			email: user.email,
			first_name: user.first_name,
			middle_name: user.middle_name,
			last_name: user.last_name,
			role: user.role,
			is_active: user.is_active,
		};

		const response = NextResponse.json({
			success: true,
			user: userResponse,
		});

		response.cookies.set('accessToken', accessToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			maxAge: 60 * 60 * 24 * 7, 
			path: '/',
		});

		response.cookies.set('refreshToken', refreshToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			maxAge: 60 * 60 * 24 * 30, 
			path: '/',
		});

		return response;

	} catch (error) {
		console.error('Login error:', error);
		return NextResponse.json(
			{ message: 'Внутренняя ошибка сервера' },
			{ status: 500 }
		);
	}
}
