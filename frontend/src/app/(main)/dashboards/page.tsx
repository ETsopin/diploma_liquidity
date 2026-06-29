'use client';

import { useState, useEffect, useCallback } from 'react';

import ContentStack from '@/components/Layout/ContentStack';
import DashboardSelector from '@/components/Dashboards/DashboardSelector';
import DashboardToolbar from '@/components/Dashboards/DashboardToolbar';
import DashboardGrid from '@/components/Dashboards/DashboardGrid';
import WidgetConfigDialog from '@/components/Dashboards/WidgetConfigDialog';
import CreateDialog from '@/components/Dashboards/CreateDialog';
import ShareDialog from '@/components/Dashboards/ShareDialog';

import { useAuth } from '@/context/AuthContext';

import {
	Stack,
	Typography,
	Alert,
	CircularProgress,
	IconButton,
	Tooltip,
} from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import { Dashboard, DashboardWidget } from '@/types/dashboards';

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export default function DashboardsPage() {
	const { user, loading: authLoading } = useAuth();

	const [dashboards, setDashboards] = useState<Dashboard[]>([]);
	const [activeId, setActiveId] = useState<string | null>(null);
	const [mode, setMode] = useState<'view' | 'edit'>('view');
	const [sessionConfigs, setSessionConfigs] = useState<
		Record<string, Record<string, any>>
	>({});
	const [loading, setLoading] = useState(true);

	const [configWidget, setConfigWidget] = useState<DashboardWidget | null>(null);
	const [createOpen, setCreateOpen] = useState(false);
	const [shareOpen, setShareOpen] = useState(false);

	const active = dashboards.find((d) => d._id === activeId);

	const canEdit = active && user
		? (user.role === 'admin' ||
			 active.owner_id === user.id ||
			 (active.sharing.mode === 'shared' &&
			  active.sharing.shared_with.includes(user.id)))
		: false;

	const loadDashboards = useCallback(async () => {
		try {
			const res = await fetch('/api/dashboards');
			if (res.ok) {
				const data = await res.json();
				setDashboards(data);
				if (!activeId && data.length > 0) setActiveId(data[0]._id);
			}
		} catch (e) {
			console.error('Failed to load dashboards', e);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadDashboards();
	}, [loadDashboards]);

	const autoSave = useCallback(
		(widgets: DashboardWidget[]) => {
			if (!activeId || mode !== 'edit') return;
			if (saveTimer) clearTimeout(saveTimer);
			saveTimer = setTimeout(async () => {
				try {
					await fetch(`/api/dashboards/${activeId}`, {
						method: 'PUT',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ widgets }),
					});
				} catch (e) {
					console.error('Auto-save failed', e);
				}
			}, 500);
		},
		[activeId, mode]
	);

	const handleLayoutChange = (widgets: DashboardWidget[]) => {
		setDashboards((prev) =>
			prev.map((d) => (d._id === activeId ? { ...d, widgets } : d))
		);
		autoSave(widgets);
	};

	const handleRemove = (id: string) => {
		if (!active) return;
		handleLayoutChange(active.widgets.filter((w) => w.id !== id));
	};

	const handleAddWidget = (type: string) => {
		if (!active) return;
		const { WIDGET_REGISTRY } = require('@/components/Dashboards/widgets/registry');
		const def = WIDGET_REGISTRY[type];
		if (!def) return;

		const newWidget: DashboardWidget = {
			id: crypto.randomUUID(),
			type: type as any,
			title: def.label,
			layout: { x: 0, y: Infinity, w: def.defaultSize.w, h: def.defaultSize.h },
			config: { ...def.defaultConfig },
		};

		handleLayoutChange([...active.widgets, newWidget]);
	};

	const handleConfigSave = (widgetId: string, config: Record<string, any>) => {
		if (mode === 'edit') {
			setDashboards((prev) =>
				prev.map((d) =>
					d._id === activeId
						? {
								...d,
								widgets: d.widgets.map((w) =>
									w.id === widgetId ? { ...w, config } : w
								),
						  }
						: d
				)
			);
			if (active) {
				const updated = active.widgets.map((w) =>
					w.id === widgetId ? { ...w, config } : w
				);
				autoSave(updated);
			}
		} else {
			setSessionConfigs((prev) => ({
				...prev,
				[widgetId]: config,
			}));
		}
	};

	const handleCreate = async (title: string, templateSlug: string) => {
		try {
			const res = await fetch('/api/dashboards', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title, template_slug: templateSlug }),
			});
			if (res.ok) {
				const created = await res.json();
				setDashboards((prev) => [...prev, created]);
				setActiveId(created._id);
			}
		} catch (e) {
			console.error('Create failed', e);
		}
	};

	const handleExport = () => {
		if (!active) return;
		const blob = new Blob([JSON.stringify(active, null, 2)], {
			type: 'application/json',
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${active.title}.json`;
		a.click();
		URL.revokeObjectURL(url);
	};

	const handleImport = async (file: File) => {
		try {
			const text = await file.text();
			const data = JSON.parse(text);
			const res = await fetch('/api/dashboards', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: data.title || 'Imported',
					widgets: data.widgets || [],
				}),
			});
			if (res.ok) {
				const created = await res.json();
				setDashboards((prev) => [...prev, created]);
				setActiveId(created._id);
			}
		} catch (e) {
			console.error('Import failed', e);
		}
	};

	const handleShareSave = async (sharedWith: string[]) => {
		if (!activeId) return;
		try {
			await fetch(`/api/dashboards/${activeId}/share`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ shared_with: sharedWith }),
			});
		} catch (e) {
			console.error('Share failed', e);
		}
		setShareOpen(false);
	};

	const mergedWidgets = (active?.widgets || []).map((w) => ({
		...w,
		config: sessionConfigs[w.id]
			? { ...w.config, ...sessionConfigs[w.id] }
			: w.config,
	}));

	if (loading || authLoading) return <CircularProgress sx={{ m: 4 }} />;

	return (
		<ContentStack>
			<Stack
				direction="row"
				alignItems="center"
				justifyContent="space-between"
			>
				<Typography variant="h2">Визуализация</Typography>
			</Stack>

			<Stack
				direction="row"
				alignItems="center"
				justifyContent="space-between"
			>
				<DashboardSelector
					dashboards={dashboards}
					activeId={activeId}
					onChange={setActiveId}
					onCreate={() => setCreateOpen(true)}
					onExport={handleExport}
					onImport={handleImport}
				/>
				{active && !active.is_template && (
					<Tooltip title="Поделиться">
						<IconButton onClick={() => setShareOpen(true)}>
							<ShareIcon />
						</IconButton>
					</Tooltip>
				)}
			</Stack>

			<DashboardToolbar
				mode={mode}
				onModeChange={setMode}
				canEdit={canEdit}
				onAddWidget={handleAddWidget}
			/>

			{!active && (
				<Alert severity="info">
					Нет доступных дашбордов. Создайте новый.
				</Alert>
			)}

			{active && mergedWidgets.length === 0 && (
				<Alert severity="info">
					Дашборд пуст. Добавьте виджеты в режиме редактирования.
				</Alert>
			)}

			{active && mergedWidgets.length > 0 && (
				<DashboardGrid
					widgets={mergedWidgets}
					mode={mode}
					onLayoutChange={handleLayoutChange}
					onRemove={handleRemove}
					onConfig={(id) =>
						setConfigWidget(mergedWidgets.find((w) => w.id === id) || null)
					}
				/>
			)}

			<WidgetConfigDialog
				open={Boolean(configWidget)}
				widget={configWidget}
				mode={mode}
				onSave={handleConfigSave}
				onClose={() => setConfigWidget(null)}
			/>

			<CreateDialog
				open={createOpen}
				onClose={() => setCreateOpen(false)}
				onCreate={handleCreate}
			/>

			<ShareDialog
				open={shareOpen}
				onClose={() => setShareOpen(false)}
				onSave={handleShareSave}
				initialSharedWith={active?.sharing?.shared_with || []}
			/>
		</ContentStack>
	);
}
