export type ReportType = 'full' | 'gap' | 'concentration';
export type ReportFormat = 'excel' | 'csv' | 'pdf';

export interface GenerateReportRequest {
	report_date: string;
	report_type: ReportType;
	report_format: ReportFormat;
}
