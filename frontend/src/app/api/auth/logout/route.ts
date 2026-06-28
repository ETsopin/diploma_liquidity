import { NextRequest, NextResponse } from 'next/server';

import { updateRefreshToken } from '@/services/auth';
import { verifyAccessToken } from '@/services/jwt';
import { getRequestMeta, logAction } from '@/services/logger';

export async function POST(request: NextRequest) {
	try {
		const token = request.cookies.get('accessToken')?.value;

		const payload = token ? verifyAccessToken(token) : null;
		if (payload) {
			await updateRefreshToken(payload.email, null);
		}

		const response = NextResponse.json({
			success: true,
			message: 'Выход выполнен успешно',
		});

		response.cookies.delete('accessToken');
		response.cookies.delete('refreshToken');

		const meta = getRequestMeta(request);
		if (payload) {
			logAction({
				userId: payload.userId,
				email: payload.email,
				role: payload.role,
				action: 'logout',
				entity: 'system',
				status: 'success',
				ip: meta.ip,
				userAgent: meta.userAgent
			}).catch(err => console.error('Log logout error:', err));
		}

		return response;
	} catch (error) {
		console.error('Logout error:', error);
		return NextResponse.json(
			{ message: `Ошибка при выходе: ${error}` },
			{ status: 500 }
		);
	}
}
