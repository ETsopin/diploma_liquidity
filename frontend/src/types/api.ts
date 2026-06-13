export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface HealthResponse {
	status: string;
	database: string;
};
