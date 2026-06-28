import jwt from 'jsonwebtoken';
import { JwtPayload } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_change_in_production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'supersecretrefreshkey_change_in_production';

export const generateAccessToken = (payload: JwtPayload): string => {
	return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const generateRefreshToken = (payload: JwtPayload): string => {
	return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '30d' });
};

export const verifyAccessToken = (token: string): JwtPayload | null => {
	try {
		console.log('Verifying token:', token.substring(0, 20) + '...');
		console.log('Using JWT_SECRET:', JWT_SECRET);
		const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
		console.log('Token verified:', decoded)
		return decoded;
	} catch (error) {
		console.error('Token verification failed:', error);
		return null;
	}
};

export const verifyRefreshToken = (token: string): JwtPayload | null => {
	try {
		return jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;
	} catch (error) {
		return null;
	}
};

export const decodeToken = (token: string): JwtPayload | null => {
	try {
		return jwt.decode(token) as JwtPayload;
	} catch (error) {
		return null;
	}
};
