export interface TimebucketInfo {
	id: number,
	code: string,
	name: string,
	min_days: number,
	max_days: number | null,
	sort_order: number,
};
