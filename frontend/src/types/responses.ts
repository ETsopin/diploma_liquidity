import { CalcType, ConcentrationItem, GapBucketResult } from './schemas';

export interface HealthResponse {
	status: string;
	database: string;
};

export interface CalculateResponse {
	calculation_id: number;
	status: string;
	report_date: string;
	calc_type: CalcType;
	gap_rows?: number;
	conc_rows?: number;
	duration_sec?: number | null;
}

export interface ConcentrationResponse {
	report_date: string;
	calculation_id: number;
	category: string;
	items: ConcentrationItem[];
	total_amount: number;
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

export interface GapAnalysisResponse {
	report_date: string;
	calculation_id: number;
	buckets: GapBucketResult[];
	total_assets: number;
	total_liabilities: number;
	net_gap: number;
}
