export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ValidationError {
	loc: Array<string | number>;
	msg: string;
	type: string;
	input?: any;
	ctx: object;
}
