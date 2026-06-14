export type CalcType = 'full' | 'gap' | 'concentration';

export interface CalculationRecord {
	id: number;
	report_date: string;
	calc_type: CalcType;
	status: string;
	started_at: string;
	finished_at: string | null;
	error_message: string | null;
}

export interface ConcentrationItem {
	counterparty_code: string;
	counterparty_name: string;
	counterparty_type: string;
	bucket_code: string;
	bucket_name: string;
	amount_rub: number;
	share_pct: number;
}

export interface GapBucketResult {
	bucket_code: string;
	bucket_name: string;
	sort_order: number;
	total_assets_rub: number;
	total_liabilities_rub: number;
	gap_rub: number;
	cumulitive_gap_rub: number;
	gap_ratio_pct: number;
}

export type ETLSource = 'all' | 'excel' | 'postgres';

export type ReportType = 'full' | 'gap' | 'concentration';
export type ReportFormat = 'excel' | 'csv' | 'pdf';

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

export interface TimebucketInfo {
	id: number;
	code: string;
	name: string;
	min_days: number;
	max_days: number | null;
	sort_order: number;
};

export type CounterpartyType = 'bank' | 'cbr' | 'corporate' | 'individual';

export interface CounterpartyInfo {
  id: number;
  code: string;
  short_name: string;
  full_name: string;
  inn: string | null;
  counterparty_type: CounterpartyType;
  country: string;
}
