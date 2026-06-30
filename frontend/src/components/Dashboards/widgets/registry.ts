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
	minSize?: { w: number; h: number };
	label: string;
}

export const WIDGET_REGISTRY: Record<string, WidgetDefinition> = {
	concentration_pie: {
		component: ConcentrationPieWidget,
		defaultConfig: {},
		defaultSize: { w: 6, h: 7 },
		minSize: { w: 4, h: 7 },
		label: 'Концентрация (круговая)',
	},
	gap_bar: {
		component: GapBarWidget,
		defaultConfig: {},
		defaultSize: { w: 6, h: 7 },
		minSize: { w: 4, h: 7 },
		label: 'GAP-анализ (столбцы)',
	},
	gap_trend: {
		component: GapTrendLine,
		defaultConfig: { days: 30 },
		defaultSize: { w: 8, h: 4 },
		minSize: { w: 2, h: 4 },
		label: 'Динамика GAP',
	},
	concentration_trend: {
		component: ConcentrationTrendLine,
		defaultConfig: { days: 30 },
		defaultSize: { w: 8, h: 5 },
		minSize: { w: 5, h: 5 },
		label: 'Динамика концентрации',
	},
	comparison_bar: {
		component: ComparisonBar,
		defaultConfig: {},
		defaultSize: { w: 5, h: 5 },
		minSize: { w: 2, h: 5 },
		label: 'Сравнение GAP (2 даты)',
	},
	kpi_row: {
		component: KpiRow,
		defaultConfig: {},
		defaultSize: { w: 12, h: 2 },
		minSize: { w: 6, h: 2 },
		label: 'Ключевые метрики',
	},
	report_table: {
		component: ReportTable,
		defaultConfig: {},
		defaultSize: { w: 12, h: 4 },
		minSize: { w: 6, h: 3 },
		label: 'Таблица отчёта',
	},
};
