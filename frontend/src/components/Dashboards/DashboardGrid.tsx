import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';

import WidgetWrapper from './WidgetWrapper';
import { WIDGET_REGISTRY } from './widgets/registry';
import { DashboardWidget } from '@/types/dashboards';

interface DashboardGridProps {
	widgets: DashboardWidget[];
	mode: 'view' | 'edit';
	onLayoutChange: (widgets: DashboardWidget[]) => void;
	onRemove: (id: string) => void;
	onConfig: (id: string) => void;
}

export default function DashboardGrid({
	widgets,
	mode,
	onLayoutChange,
	onRemove,
	onConfig,
}: DashboardGridProps) {
	const layout = widgets.map((w) => ({
		i: w.id,
		x: w.layout.x,
		y: w.layout.y,
		w: w.layout.w,
		h: w.layout.h,
	}));

	const handleLayoutChange = (newLayout: any[]) => {
		const updated = widgets.map((w) => {
			const item = newLayout.find((l: any) => l.i === w.id);
			return item
				? {
						...w,
						layout: { x: item.x, y: item.y, w: item.w, h: item.h },
				  }
				: w;
		});
		onLayoutChange(updated);
	};

	return (
		<GridLayout
			className="layout"
			layout={layout}
			cols={12}
			rowHeight={100}
			onLayoutChange={handleLayoutChange}
			isDraggable={mode === 'edit'}
			isResizable={mode === 'edit'}
			compactType="vertical"
			draggableHandle=".drag-handle"
		>
			{widgets.map((w) => {
				const def = WIDGET_REGISTRY[w.type];
				if (!def) return null;

				const WidgetComponent = def.component;

				return (
					<div key={w.id}>
						<WidgetWrapper
							widget={w}
							mode={mode}
							onRemove={mode === 'edit' ? onRemove : undefined}
							onConfig={mode === 'edit' ? onConfig : undefined}
						>
							<WidgetComponent {...w.config} />
						</WidgetWrapper>
					</div>
				);
			})}
		</GridLayout>
	);
}
