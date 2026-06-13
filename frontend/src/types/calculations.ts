export type CalcType = 'full' | 'gap' | 'concentration';

export interface CalculateRequest {
	calc_type?: CalcType,
	report_date: string;
}

export interface CalculateResponse {
	calculation_id: number;
	status: string;
	report_date: string;
	calc_type: string;
	gap_rows?: number;
	conc_rows?: number;
	duration_sec?: number | null;
}

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
	amount_tub: number;
	share_pct: number;
}

export interface ConcentrationResponse {
	report_date: string;
	calculation_id: number;
	category: string;
	items: ConcentrationItem[];
	total_amount: number;
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

export interface GapAnalysisResponse {
	report_date: string;
	calculation_id: number;
	buckets: GapBucketResult[];
	total_assets: number;
	total_liabilities: number;
	net_gap: number;
}
