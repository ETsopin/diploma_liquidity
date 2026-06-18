import { NextResponse } from 'next/server';
import clientPromise from '@/services/mongodb';

export async function GET() {
	try {
		const client = await clientPromise;
		const db = client.db('liquidity');
		await db.command({ping: 1});

		return NextResponse.json({connected: true});
	} catch (error) {
		return NextResponse.json(
			{connected: false, error: String(error)},
			{status: 500}
		);
	}
}
