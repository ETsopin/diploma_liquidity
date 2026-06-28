import clientPromise from './mongodb';
import { NextRequest } from 'next/server';
import { ObjectId } from 'mongodb';

interface LogEntry {
	userId: string;
	email?: string | null;
	role?: string | null;
	action: string;
	entity?: string | null;
	entityId?: string | null;
	status?: string;
	ip?: string | null;
	userAgent?: string | null;
	details?: Record<string, any> | null;
	error?: string | null;
}

export const logAction = async (entry: LogEntry) => {
	const client = await clientPromise;
	const db = client.db('liquidity');

	const doc: Record<string, any> = {
		user_id: new ObjectId(entry.userId),
		action: entry.action,
		timestamp: new Date(),
		status: entry.status || 'success',
	};

	if (entry.email) doc.user_email = entry.email;
	if (entry.role) doc.user_role = entry.role;
	if (entry.entity) doc.entity = entry.entity;
	if (entry.entityId) doc.entity_id = entry.entityId;
	if (entry.ip) doc.ip = entry.ip;
	if (entry.userAgent) doc.user_agent = entry.userAgent;
	if (entry.details) doc.details = entry.details;
	if (entry.error) doc.error = entry.error;

	return db.collection('logs').insertOne(doc);
};

export const getRequestMeta = (request: NextRequest) => ({
	ip: request.headers.get('x-forwarded-for') || 'unknown',
	userAgent: request.headers.get('user-agent') || 'unknown',
});

export const findAllLogs = async (
	limit: number = 50,
	offset: number = 0,
	action?: string
) : Promise<{ items: any[]; total: number}> => {
	const client = await clientPromise;
	const db = client.db('liquidity');
	const collection = db.collection('logs');

	const query: Record<string, any> = {};
	if (action) query.action = action;

	const [items, total] = await Promise.all([
		collection.find(query).sort( {timestamp: -1} ).skip(offset).limit(limit).toArray(),
		collection.countDocuments(query),
	]);

	return { items, total };
};
