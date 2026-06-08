export type ReportType = 'full' | 'gap' | 'concentration';
export type ReportFormat = 'excel' | 'csv' | 'pdf';

export interface ReportGenerateRequest {
	report_date: string;
	report_type: ReportType;
	report_format: ReportFormat;
}

export interface ReportTaskRecord {
	id: number;
	report_date: string;
	report_type: ReportType;
	report_format: ReportFormat;
	report_name: string | null;
	status: string;
	file_path: string | null;
	error_message: string | null;
	created_at: string;
	finished_at: string | null;
}

export interface ReportsGetRequest {
	limit: number;
	offset: number;
}

export interface ReportsGetResponse {
	items: ReportsTaskRecord[];
	total: number;
	limit: number;
	offset: number;
}

export interface ReportGetDetailsRequest {
	task_id: number;
}

export interface ReportDownloadRequest {
	task_id: number;
}
