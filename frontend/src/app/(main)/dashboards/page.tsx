'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

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

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

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

	const exportRef = useRef<HTMLDivElement>(null);

	const active = dashboards.find((d) => d._id === activeId);

	const canEdit = active && user
		? (user.role === 'admin' ||
			 active.owner_id === user.id ||
			 (active.sharing.mode === 'shared' &&
			  active.sharing.shared_with.includes(user.id)))
		: false;

	const canDelete = active && user
		? user.role === 'admin' || active.owner_id === user.id
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
					const res = await fetch(`/api/dashboards/${activeId}`, {
						method: 'PUT',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ widgets }),
					});
					if (!res.ok) console.error('Auto-save failed', await res.text());
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

		const maxY = active.widgets.reduce(
			(max, w) => Math.max(max, w.layout.y + w.layout.h), 0
		);
		const newWidget: DashboardWidget = {
			id: crypto.randomUUID(),
			type: type as any,
			title: def.label,
			layout: { x: 0, y: maxY, w: def.defaultSize.w, h: def.defaultSize.h },
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

	const handleDelete = async () => {
		if (!activeId || !active) return;
		try {
			const res = await fetch(`/api/dashboards/${activeId}`, { method: 'DELETE' });
			if (res.ok) {
				const updated = dashboards.filter((d) => d._id !== activeId);
				setDashboards(updated);
				setActiveId(updated.length > 0 ? updated[0]._id : null);
			}
		} catch (e) {
			console.error('Delete failed', e);
		}
	};

	const handleExportPNG = async () => {
	  if (!exportRef.current || !active) return;
	  const canvas = await html2canvas(exportRef.current);
	  const link = document.createElement('a');
	  link.download = `${active.title}.png`;
	  link.href = canvas.toDataURL();
	  link.click();
	};

	const handleExportPDF = async () => {
	  if (!exportRef.current || !active) return;
	  const canvas = await html2canvas(exportRef.current);
	  const imgData = canvas.toDataURL('image/png');
	  const pdf = new jsPDF('l', 'mm', 'a4');
	  const pdfW = pdf.internal.pageSize.getWidth();
	  const pdfH = (canvas.height * pdfW) / canvas.width;
	  pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
	  pdf.save(`${active.title}.pdf`);
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
				spacing={1}
			>
				<DashboardSelector
					dashboards={dashboards}
					activeId={activeId}
					onChange={setActiveId}
					onCreate={() => setCreateOpen(true)}
					onExport={handleExport}
					onImport={handleImport}
					onDelete={handleDelete}
					canDelete={canDelete}
					onExportPNG={handleExportPNG}
					onExportPDF={handleExportPDF}
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
				<div ref={exportRef}>
					<DashboardGrid
						widgets={mergedWidgets}
						mode={mode}
						onLayoutChange={handleLayoutChange}
						onRemove={handleRemove}
						onConfig={(id) =>
							setConfigWidget(mergedWidgets.find((w) => w.id === id) || null)
						}
					/>
				</div>
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
