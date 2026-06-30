db.createUser({
	user: 'app_user',
	pwd: 'app_password',
	roles: [{ role: 'readWrite', db: 'liquidity' }]
});

db = db.getSiblingDB('liquidity');


//
// Users Collection
//

db.createCollection('users', {
	validator: {
		$jsonSchema: {
			bsonType: 'object',
			required: ['email', 'password_hash', 'role'],
			properties: {
				email: { bsonType: 'string' },
				password_hash: { bsonType: 'string' },
				first_name: { bsonType: 'string' },
				middle_name: { bsonType: 'string' },
				last_name: { bsonType: 'string' },
				role: {
					bsonType: 'string',
					enum: ['admin', 'analyst', 'viewer']
				},
				is_active: { bsonType: 'bool' },
				created_at: { bsonType: 'date' },
				last_login: { bsonType: ['date', 'null'] },
				refresh_token: { bsonType: ['string', 'null'] },
				settings: {
					bsonType: 'object',
					properties: {
						theme: { bsonType: 'string' },
					}
				},
				audit: {
					bsonType: 'object',
					properties: {
						created_by: { bsonType: 'string' },
						updated_at: { bsonType: 'date' },
						updated_by: { bsonType: 'string' }
					}
				},
				sessions: {
					bsonType: 'array',
					items: {
						bsonType: 'object',
						properties: {
							token: { bsonType: 'string' },
							ip: { bsonType: 'string' },
							user_agent: { bsonType: 'string' },
							created_at: { bsonType: 'date' },
							expires_at: { bsonType: 'date' }
						}
					}
				}
			}
		}
	}
});


//
// Logs Collection
//

db.createCollection('logs', {
	validator: {
		$jsonSchema: {
			bsonType: 'object',
			required: ['user_id', 'action', 'timestamp'],
			properties: {
				user_id: { bsonType: 'objectId' },
				user_email: { bsonType: 'string' },
				user_role: { bsonType: 'string' },
				action: {
					bsonType: 'string',
					enum: [
						'login', 'logout',
						'generate_report', 'download_report',
						'run_etl', 'run_calculation',
						'view_dashboard', 'change_theme',
						'update_settings',
						'user_create', 'user_update', 'user_delete'
					]
				},
				entity: {
					bsonType: 'string',
					enum: ['report', 'calculation', 'etl', 'user', 'system']
				},
				entity_id: { bsonType: 'string' },
				status: {
					bsonType: 'string',
					enum: ['success', 'error', 'pending']
				},
				timestamp: { bsonType: 'date' },
				duration_ms: { bsonType: 'number' },
				ip: { bsonType: 'string' },
				user_agent: { bsonType: 'string' },
				details: { bsonType: 'object' },
				error: { bsonType: 'string' }
			}
		}
	}
});


//
// Dashboards Collection
// 

db.createCollection('dashboards', {
	validator: {
		$jsonSchema: {
			bsonType: 'object',
			required: ['title', 'owner_id', 'owner_email', 'sharing', 'widgets', 'created_at', 'updated_at'],
			properties: {
				title: { bsonType: 'string' },
				description: { bsonType: 'string' },
				owner_id: { bsonType: 'objectId' },
				owner_email: { bsonType: 'string' },
				is_template: { bsonType: 'bool' },
				template_slug: { enum: ['gap_analysis', 'concentration', 'full_report', 'empty', null] },
				sharing: {
					bsonType: 'object',
					required: ['mode', 'shared_with'],
					properties: {
						mode: { enum: ['private', 'shared'] },
						shared_with: { bsonType: 'array', items: { bsonType: 'objectId' } },
					},
				},
				widgets: {
					bsonType: 'array',
					items: {
						bsonType: 'object',
						required: ['id', 'type', 'title', 'layout', 'config'],
						properties: {
							id: { bsonType: 'string' },
							type: { enum: ['concentration_pie', 'gap_bar', 'gap_trend', 'concentration_trend', 'comparison_bar', 'kpi_row', 'report_table'] },
							title: { bsonType: 'string' },
							layout: {
								bsonType: 'object',
								required: ['x', 'y', 'w', 'h'],
								properties: {
									x: { bsonType: 'int' },
									y: { bsonType: 'int' },
									w: { bsonType: 'int' },
									h: { bsonType: 'int' },
								},
							},
							config: { bsonType: 'object' },
						},
					},
				},
				created_at: { bsonType: 'date' },
				updated_at: { bsonType: 'date' },
			},
		},
	},
});


//
// Dashboards Templates Seeds
//

db.dashboards.insertMany([
	{
		title: 'Gap-анализ (Шаблон)',
		description: '',
		owner_id: ObjectId('6a334da0cfcac6a3049df8a3'),
		owner_email: 'admin@system.com',
		is_template: true,
		template_slug: 'gap_analysis',
		sharing: { mode: 'shared', shared_with: [] },
		widgets: [
			{
				id: 't1', type: 'gap_bar', title: 'GAP-анализ (столбцы)',
				layout: { x: 0, y: 0, w: 6, h: 7 }, config: {},
			},
			{
				id: 't2', type: 'kpi_row', title: 'Ключевые метрики',
				layout: { x: 6, y: 0, w: 6, h: 2 }, config: {},
			},
			{
				id: 't3', type: 'comparison_bar', title: 'Сравнение GAP (2 даты)',
				layout: { x: 6, y: 2, w: 6, h: 5 }, config: {},
			},
			{
				id: 't4', type: 'gap_trend', title: 'Динамика GAP',
				layout: { x: 0, y: 7, w: 12, h: 4 }, config: { days: 30 },
			},
			{
				id: 't5', type: 'report_table', title: 'Таблица отчёта',
				layout: { x: 0, y: 11, w: 12, h: 4 }, config: {},
			},
		],
		created_at: new Date(),
		updated_at: new Date(),
	},
	{
		title: 'Концентрация (Шаблон)',
		description: '',
		owner_id: ObjectId('6a334da0cfcac6a3049df8a3'),
		owner_email: 'admin@system.com',
		is_template: true,
		template_slug: 'concentration',
		sharing: { mode: 'shared', shared_with: [] },
		widgets: [
			{
				id: 't1', type: 'concentration_pie', title: 'Концентрация (круговая)',
				layout: { x: 0, y: 0, w: 6, h: 7 }, config: {},
			},
			{
				id: 't2', type: 'kpi_row', title: 'Ключевые метрики',
				layout: { x: 6, y: 0, w: 6, h: 2 }, config: {},
			},
			{
				id: 't3', type: 'concentration_trend', title: 'Динамика концентрации',
				layout: { x: 6, y: 2, w: 6, h: 5 }, config: { days: 30 },
			},
			{
				id: 't4', type: 'report_table', title: 'Таблица отчёта',
				layout: { x: 0, y: 7, w: 12, h: 4 }, config: {},
			},
		],
		created_at: new Date(),
		updated_at: new Date(),
	},
	{
		title: 'Полный отчет (Шаблон)',
		description: '',
		owner_id: ObjectId('6a334da0cfcac6a3049df8a3'),
		owner_email: 'admin@system.com',
		is_template: true,
		template_slug: 'full_report',
		sharing: { mode: 'shared', shared_with: [] },
		widgets: [
			{
				id: 't1', type: 'kpi_row', title: 'Ключевые метрики',
				layout: { x: 0, y: 0, w: 12, h: 2 }, config: {},
			},
			{
				id: 't2', type: 'concentration_pie', title: 'Концентрация (круговая)',
				layout: { x: 0, y: 2, w: 6, h: 7 }, config: {},
			},
			{
				id: 't3', type: 'gap_bar', title: 'GAP-анализ (столбцы)',
				layout: { x: 6, y: 2, w: 6, h: 7 }, config: {},
			},
			{
				id: 't4', type: 'gap_trend', title: 'Динамика GAP',
				layout: { x: 0, y: 9, w: 12, h: 4 }, config: { days: 30 },
			},
			{
				id: 't5', type: 'concentration_trend', title: 'Динамика концентрации',
				layout: { x: 0, y: 13, w: 7, h: 5 }, config: { days: 30 },
			},
			{
				id: 't6', type: 'comparison_bar', title: 'Сравнение GAP (2 даты)',
				layout: { x: 7, y: 13, w: 5, h: 5 }, config: {},
			},
			{
				id: 't7', type: 'report_table', title: 'Таблица отчёта',
				layout: { x: 0, y: 18, w: 12, h: 4 }, config: {},
			},
		],
		created_at: new Date(),
		updated_at: new Date(),
	},
	{
		title: 'Пустой дашборд',
		description: 'Начните с чистого листа',
		owner_id: ObjectId('6a334da0cfcac6a3049df8a3'),
		owner_email: 'admin@system.com',
		is_template: true,
		template_slug: 'empty',
		sharing: { mode: 'shared', shared_with: [] },
		widgets: [],
		created_at: new Date(),
		updated_at: new Date(),
	},
]);


//
// Indexes
//

db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ is_active: 1 });
db.users.createIndex({ created_at: -1 });

db.logs.createIndex({ user_id: 1, timestamp: -1 });
db.logs.createIndex({ action: 1 });
db.logs.createIndex({ entity: 1, entity_id: 1 });
db.logs.createIndex({ timestamp: -1 });
db.logs.createIndex({ timestamp: 1 }, { expireAfterSeconds: 2592000 }); 

db.dashboards.createIndex({ owner_id: 1 });
db.dashboards.createIndex({ 'sharing.mode': 1, 'sharing.shared_with': 1 });
db.dashboards.createIndex({ is_template: 1 });


//
// Test User
//

db.users.insertOne({
	email: 'admin@system.com',
	password_hash: '$2b$12$coOaXtC60HVCUmwC5/JC3OjZfEo3P2g/NcjZ1TJrtuR73idk/sUnu', // admin123
	first_name: 'Sys',
	middle_name: 'Tem',
	last_name: 'Administrator',
	role: 'admin',
	is_active: true,
	created_at: new Date(),
	last_login: null,
	refresh_token: null,
	settings: {
		theme: 'dark'
	},
	audit: {
		created_by: 'system',
		updated_at: new Date(),
		updated_by: 'system'
	},
	sessions: []
});
