export interface User {
	_id: string;
	email: string;
	password_hash: string;
	first_name: string;
	middle_name: string;
	last_name: string;
	role: 'admin' | 'analyst' | 'viewer';
	is_active: boolean;
	create_at: Date;
	last_login: Date | null;
	refresh_token: string | null;
	settings: {
		theme: string;
	};
	audit: {
		created_by: string;
		updated_at: Date;
		updated_by: string;
	};
	sessions: {
		token: string;
		ip: string;
		user_agent: string;
		created_at: Date;
		expires_at: Date;
	}[];
}
