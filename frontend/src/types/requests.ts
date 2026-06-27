import { CalcType, ETLSource, ReportType, ReportFormat } from './schemas';

export interface CalculateRequest {
	calc_type?: CalcType,
	report_date: string;
}

export interface ETLRunRequest {
	source: ETLSource;
	report_date: string | null;
}

export interface ReportGenerateRequest {
	report_date: string;
	report_type: ReportType;
	report_format: ReportFormat;
}

export interface CreateUserRequest {
	email: string;
	password: string;
	first_name: string;
	middle_name?: string;
	last_name: string;
	role: 'viewer' | 'analyst' | 'admin';
}

export interface UpdateUserRequest {
	first_name?: string;
	middle_name?: string;
	last_name?: string;
	role?: 'viewer' | 'analyst' | 'admin';
	is_active?: boolean;
}
