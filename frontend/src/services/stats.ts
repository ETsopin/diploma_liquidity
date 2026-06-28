import clientPromise from './mongodb';


export interface SummaryStats {
	total_users: number;
	total_logs: number;
	total_reports: number;
	total_calculations: number;
	total_etls: number;
}

export interface UserActivityItem {
	user_email: string;
	count: number;
}

export interface TimelineItem {
	date: string;
	total: number;
	etl: number;
	report: number;
	calculation: number;
}

export const getSummaryStats = async () : Promise<SummaryStats> => {
	const client = await clientPromise;
	const db = client.db('liquidity');

	const [
		total_users,
		total_logs,
		total_reports,
		total_calculations,
		total_etls
	] = await Promise.all([
		db.collection('users').countDocuments({ is_active: { $ne: false } }),
		db.collection('logs').countDocuments(),
		db.collection('logs').countDocuments({ entity: 'report' }),
		db.collection('logs').countDocuments({ entity: 'calculation' }),
		db.collection('logs').countDocuments({ entity: 'etl' }),
	]);

	return {
		total_users,
		total_logs,
		total_reports,
		total_calculations,
		total_etls
	};
};

export const getUserActivity = async (
	entity: string
) : Promise<UserActivityItem[]> => {
	const client = await clientPromise;
	const db = client.db('liquidity');

	return db
		.collection('logs')
		.aggregate([
			{ $match: { entity }},
			{ $group: { _id: '$user_email', count: { $sum: 1 } } },
			{ $sort: { count: -1 } },
			{ $project: { _id: 0, user_email: '$_id', count: 1 } },
		])
		.toArray();
};

export const getTimeline = async (
	days: number = 30
): Promise<TimelineItem[]> => {
	const client = await clientPromise;
	const db = client.db('liquidity');

	const since = new Date();
	since.setDate(since.getDate() - days);

	const results = await db
		.collection('logs')
		.aggregate([
			{ $match: { timestamp: { $gte: since  } } },
			{ $group: {
				_id: { $dateToString: {
					format: '%Y-%m-%d',
					date: '$timestamp' 
				} },
				total: { $sum: 1 },
				etl: { $sum: { $cond: [{ $eq: ['$entity', 'etl'] }, 1, 0,] } },
				report: { $sum: { $cond: [{ $eq: ['$entity', 'report'] }, 1, 0,] } },

				calculation: { $sum: { $cond: [{ $eq: ['$entity', 'calculation'] }, 1, 0,] } },
				},
			},
			{ $sort: { _id: -1 } },
			{ $project: { 
				date: '$_id',
			   	total: 1,
			   	etl: 1,
			   	report: 1,
			   	calculation : 1,
				_id: 0
			} }, 
		])
		.toArray();

	const filled: TimelineItem[] = [];
	const now = new Date();
	for (let i = days - 1; i >= 0; i--) {
		const date = new Date(now);
		date.setDate(date.getDate() - i);
		const dateStr = date.toISOString().slice(0, 10);
		const existing = results.find((r: any) => r.date === dateStr);

		filled.push({
			date: dateStr,
			total: existing?.total || 0,
			etl: existing?.etl || 0,
			report: existing?.report | 0,
			calculation: existing?.calculation || 0,
		});
	}

	return filled;
};
