export type WidgetType = 
	| 'concentration_pie'
	| 'gap_bar'
	| 'gap_trend'
	| 'concentration_trend'
	| 'comparison_bar'
	| 'kpi_row'
	| 'report_table';

export interface DashboardWidget {
	id: string;
	type: WidgetType;
	title: string;
	layout: {
		x: number;
		y: number;
		w: number;
		h: number;
	};
	config: Record<string, any>;
}

export type SharingMode = 'private' | 'shared';

export interface Dashboard {
	_id: string;
	title: string;
	description?: string;
	owner_id: string;
	owner_email: string;
	is_template: boolean;
	template_slug?: 'gap_analysis' | 'concentration' | 'full_report' | 'empty';
	sharing: {
		mode: SharingMode;
		shared_with: string[];
	};
	widgets: DashboardWidget[];
	created_at: string;
	updated_at: string;
}
