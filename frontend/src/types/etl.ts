export type SourceETL = 'all' | 'excel' | 'postgres';

export interface LaunchETLRequest {
	source: SourceETL,
	report_date: string;
}
