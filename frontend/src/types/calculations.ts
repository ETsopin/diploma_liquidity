export type CalcType = 'full' | 'gap' | 'concentration';

export interface LaunchCalculationRequest {
	calc_type: CalcType,
	report_date: string;
}
