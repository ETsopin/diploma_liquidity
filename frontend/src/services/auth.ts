import clientPromise from './mongodb';
import { User } from '@/types';

export const findUserByEmail = async (email: string) => {
	const client = await clientPromise;
	const db = client.db('liquidity');
	return db.collection('users').findOne({ email });
};

export const findUserById = async (id: string) => {
	const client = await clientPromise;
	const db = client.db('liquidity');
	return db.collection('users').findOne({_id: id});
};

export const createUser = async (userData: {
	email: string;
	password_hash: string;
	first_name: string;
	middle_name?: string;
	last_name: string;
	role?: 'admin' | 'analyst' | 'viewer';
}) => {
	const client = await clientPromise;
	const db = client.db('liquidity');

	const newUser = {
		...userData,
		middle_name: userData.middle_name || '',
		role: userData.role || 'viewer',
		is_active: true,
		created_at: new Date(),
		last_login: null,
		refresh_token: null,
		settings: {
			theme: 'light',
		},
		audit: {
			created_by: 'system',
			updated_at: new Date(),
			updated_by: 'system',
		},
		sessions: [],
	};

	const result = await db.collection('users').insertOne(newUser);
	return { ...newUser, _id: result.insertedId };
};

export const updateRefreshToken = async (email: string, refreshToken: string | null) => {
	const client = await clientPromise;
	const db = client.db('liquidity');
	return db.collection('users').updateOne(
		{ email },
		{ $set: { refresh_token: refreshToken } }
	);
};

export const updateLastLogin = async (email: string) => {
	const client = await clientPromise;
	const db = client.db('liquidity');
	return db.collection('users').updateOne(
		{ email },
		{ $set: { last_login: new Date() } }
	);
};
