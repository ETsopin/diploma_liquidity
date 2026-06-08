export type ETLSource = 'all' | 'excel' | 'postgres';

export interface ETLRunRequest {
	source: ETLSource;
	report_date: string | null;
}

export interface ETLRunResponse {
	batch_id: number;
	status: string;
	source: string;
	report_date: string;
	assets_loaded?: number;
	liabs_loaded?: number;
	started_at: string;
	finished_at?: string | null;
	error?: string | null;
}
