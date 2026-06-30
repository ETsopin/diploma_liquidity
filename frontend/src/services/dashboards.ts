import { ObjectId, Int32 } from 'mongodb';
import clientPromise from './mongodb';

import { Dashboard, DashboardWidget } from '@/types/dashboards';

const transform = (doc: any): Dashboard => ({
	...doc,
	_id: doc._id.toString(),
	owner_id: doc.owner_id.toString(),
	sharing: {
		...doc.sharing,
		shared_with: doc.sharing.shared_with.map((id: any) => id.toString())
	},
	created_at: doc.created_at instanceof Date ? doc.created_at.toISOString() : doc.created_at,
	updated_at: doc.updated_at instanceof Date ? doc.updated_at.toISOString() : doc.updated_at,
});

export const findAccessibleDashboards = async (
	userId: string,
	role: string
): Promise<Dashboard[]> => {
	const client = await clientPromise;
	const db = client.db('liquidity');

	const query: Record<string, any> =
		role === 'admin'
			? {}
			: {
				$or: [
					{ owner_id: new ObjectId(userId) },
					{ is_template: true },
					{ 
						'sharing.mode': 'shared',
						'sharing.shared_with': new ObjectId(userId),
					},
				],
			};

	const docs = await db
		.collection('dashboards')
		.find(query)
		.sort({ updated_at: -1 })
		.toArray();

	return docs.map(transform);
};

export const findDashboardById = async (
	id: string
): Promise<Dashboard | null> => {
	const client = await clientPromise;
	const db = client.db('liquidity');
	const doc = await db.collection('dashboards').findOne(
		{ _id: new ObjectId(id) }
	);

	return doc ? transform(doc) : null;
};

export const getDashboardWithAccess = async (
	dashboardId: string,
	userId: string,
	role: string
): Promise<{ dashboard: Dashboard; canEdit: boolean} | null> => {
	const dashboard = await findDashboardById(dashboardId);
	if (!dashboard) return null;

	const canView = 
		role === 'admin' ||
		dashboard.owner_id === userId ||
		(dashboard.sharing.mode === 'shared' && 
		 dashboard.sharing.shared_with.includes(userId));

	if (!canView) return null;

	const canEdit = 
		role !== 'viewer' &&
		(role === 'admin' || 
		 dashboard.owner_id === userId ||
		 (dashboard.sharing.mode === 'shared' && 
		  dashboard.sharing.shared_with.includes(userId)));

	return { dashboard, canEdit };
};

export const createDashboard = async (
	data: {
		title: string;
		description?: string;
		template_slug?: string;
	},
	ownerId: string,
	ownerEmail: string
): Promise<Dashboard> => {
	const client = await clientPromise;
	const db = client.db('liquidity');

	let widgets: DashboardWidget[] = [];

	if (data.template_slug) {
		const template = await db.collection('dashboards').findOne({
			is_template: true,
			template_slug: data.template_slug,
		});

		if (template) {
			widgets = template.widgets.map((w: any) => ({
				...w,
				id: crypto.randomUUID(),
				layout: {
					x: new Int32(w.layout.x),
					y: new Int32(w.layout.y),
					w: new Int32(w.layout.w),
					h: new Int32(w.layout.h),
				},
			}));
		}
	}

	const doc = {
		title: data.title,
		description: data.description || '',
		owner_id: new ObjectId(ownerId),
		owner_email: ownerEmail,
		is_template: false,
		template_slug: null,
		sharing: {mode: 'private' as const, shared_with: [] as string[]},
		widgets,
		created_at: new Date(),
		updated_at: new Date(),
	};

	const result = await db.collection('dashboards').insertOne(doc);
	return transform({ ...doc, _id: result.insertedId });
};

export const updateDashboard = async (
	id: string,
	data: {
		title?: string;
		description?: string;
		widgets?: DashboardWidget[]
	}
): Promise<Dashboard | null> => {
	const client = await clientPromise;
	const db = client.db('liquidity');

	const update: Record<string, any> = {updated_at: new Date()};

	if (data.title !== undefined) update.title = data.title;
	if (data.description !== undefined) update.description = data.description;
	if (data.widgets !== undefined) {
		update.widgets = data.widgets.map((w) => ({
			...w,
			layout: {
				x: new Int32(w.layout.x),
				y: new Int32(w.layout.y),
				w: new Int32(w.layout.w),
				h: new Int32(w.layout.h),
			},
		}));
	}

	const result = await db
		.collection('dashboards')
		.findOneAndUpdate(
			{ _id: new ObjectId(id) },
			{ $set: update },
			{ returnDocument: 'after' }
		);
	
	return result ? transform(result) : null;
};

export const deleteDashboard = async (
	id: string
): Promise<boolean> => {
	const client = await clientPromise;
	const db = client.db('liquidity');

	const result = await db.collection('dashboards').deleteOne(
		{ _id: new ObjectId(id) }
	);

	return result.deletedCount === 1;
};

export const updateSharing = async (
	id: string,
	sharedWith: string[]
): Promise<Dashboard | null> => {
	const client = await clientPromise;
	const db = client.db('liquidity');

	const result = await db
		.collection('dashboards')
		.findOneAndUpdate(
			{ _id: new ObjectId(id) },
			{
				$set: {
					'sharing.shared_with': sharedWith.map((uid) => new ObjectId(uid)),
					'sharing.mode': sharedWith.length > 0 ? 'shared' : 'private',
					updated_at: new Date(),
				},
			},
			{ returnDocument: 'after' }
		);

	return result ? transform(result) : null;
};

export const findDashboardUsers = async ():
Promise<{ _id: string; email: string; role: string }[]> => {
	const client = await clientPromise;
	const db = client.db('liquidity');

	const users = await db
		.collection('users')
		.find({}, { projection: { _id: 1, email: 1, role: 1 } })
		.toArray();

	return users.map((u) => ({
		_id: u._id.toString(),
		email: u.email,
		role: u.role,
	}));
};
