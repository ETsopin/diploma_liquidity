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

//
// Test User
//

db.users.insertOne({
	email: 'admin@system.com',
	password_hash: '$2b$12$Qn7T8XqY1Z2a3b4c5d6e7f', // admin123
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
