import { NextRequest, NextResponse } from 'next/server';

import { verifyAccessToken } from '@/services/jwt';
import { findUserById } from '@/services/auth';

export async function GET(request: NextRequest) {
	const token = request.cookies.get('accessToken')?.value;

	if (!token) {
		return NextResponse.json(
			{ valid: false, message: 'Токен отсутствует' },
			{ status: 401 }
		);
	}

	const payload = verifyAccessToken(token);
	console.log("Token Payload:", payload);
	if (!payload) {
		const response = NextResponse.json(
			{ valid: false, message: 'Недействительный токен' },
			{ status: 401 }
		);
		response.cookies.delete('accessToken');
		response.cookies.delete('refreshToken');
		return response;
	}

	const user = await findUserById(payload.userId);
	if (!user) {
		return NextResponse.json(
			{ valid: false, message: 'Пользователь не найден' },
			{ status: 404 }
		);
	}

	return NextResponse.json({
		valid: true,
		user: {
			id: user._id,
			email: user.email,
			role: user.role,
			first_name: user.first_name,
			middle_name: user.middle_name,
			last_name: user.last_name,
		},
	});
}
