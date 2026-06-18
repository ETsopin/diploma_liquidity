import { NextRequest, NextResponse } from 'next/server';
import { updateRefreshToken } from '@/services/auth';
import { verifyAccessToken } from '@/services/jwt';

export async function POST(request: NextRequest) {
	try {
		const token = request.cookies.get('accessToken')?.value;

		if (token) {
			const payload = verifyAccessToken(token);
			if (payload) {
				await updateRefreshToken(payload.email, null);
			}
		}

		const response = NextResponse.json({
			success: true,
			message: 'Выход выполнен успешно',
		});

		response.cookies.delete('accessToken');
		response.cookies.delete('refreshToken');

		return response;
	} catch (error) {
		console.error('Logout error:', error);
		return NextResponse.json(
			{ message: `Ошибка при выходе: ${error}` },
			{ status: 500 }
		);
	}
}
