import { ComponentType } from 'react';
import ConcentrationPieWidget from './ConcentrationPieWidget';
import GapBarWidget from './GapBarWidget';
import GapTrendLine from './GapTrendLine';
import ConcentrationTrendLine from './ConcentrationTrendLine';
import ComparisonBar from './ComparisonBar';
import KpiRow from './KpiRow';
import ReportTable from './ReportTable';

export interface WidgetDefinition {
	component: ComponentType<any>;
	defaultConfig: Record<string, any>;
	defaultSize: { w: number; h: number };
	label: string;
}

export const WIDGET_REGISTRY: Record<string, WidgetDefinition> = {
	concentration_pie: {
		component: ConcentrationPieWidget,
		defaultConfig: {},
		defaultSize: { w: 6, h: 5 },
		label: 'Концентрация (круговая)',
	},
	gap_bar: {
		component: GapBarWidget,
		defaultConfig: {},
		defaultSize: { w: 6, h: 4 },
		label: 'GAP-анализ (столбцы)',
	},
	gap_trend: {
		component: GapTrendLine,
		defaultConfig: { days: 30 },
		defaultSize: { w: 12, h: 4 },
		label: 'Динамика GAP',
	},
	concentration_trend: {
		component: ConcentrationTrendLine,
		defaultConfig: { days: 30 },
		defaultSize: { w: 12, h: 4 },
		label: 'Динамика концентрации',
	},
	comparison_bar: {
		component: ComparisonBar,
		defaultConfig: {},
		defaultSize: { w: 6, h: 4 },
		label: 'Сравнение GAP (2 даты)',
	},
	kpi_row: {
		component: KpiRow,
		defaultConfig: {},
		defaultSize: { w: 12, h: 1 },
		label: 'Ключевые метрики',
	},
	report_table: {
		component: ReportTable,
		defaultConfig: {},
		defaultSize: { w: 12, h: 4 },
		label: 'Таблица отчёта',
	},
};
