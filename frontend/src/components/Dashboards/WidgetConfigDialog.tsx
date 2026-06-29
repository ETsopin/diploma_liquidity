'use client';

import { useState, useEffect } from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Select,
	MenuItem,
	FormControl,
	InputLabel,
	ToggleButtonGroup,
	ToggleButton,
	Stack,
} from '@mui/material';
import { DashboardWidget } from '@/types/dashboards';
import { getCalculations } from '@/services/api';
import { formatISODate } from '@/utils/dateUtils';

interface WidgetConfigDialogProps {
	open: boolean;
	widget: DashboardWidget | null;
	mode: 'view' | 'edit';
	onSave: (widgetId: string, config: Record<string, any>) => void;
	onClose: () => void;
}

const DAYS_OPTIONS = [7, 14, 30];

export default function WidgetConfigDialog({
	open,
	widget,
	mode,
	onSave,
	onClose,
}: WidgetConfigDialogProps) {
	const [calcs, setCalcs] = useState<any[]>([]);
	const [config, setConfig] = useState<Record<string, any>>({});

	useEffect(() => {
		if (!open) return;
		(async () => {
			const res = await getCalculations(50, 0);
			const items = (res?.items || []).filter(
				(c: any) => c.calc_type === 'gap' || c.calc_type === 'full'
			);
			const seen = new Map<string, any>();
			items.forEach((c: any) => {
				const existing = seen.get(c.report_date);
				if (!existing || c.id > existing.id) seen.set(c.report_date, c);
			});
			setCalcs(Array.from(seen.values()));
		})();
	}, [open]);

	useEffect(() => {
		if (widget) setConfig({ ...widget.config });
	}, [widget]);

	const handleSave = () => {
		if (widget) onSave(widget.id, config);
		onClose();
	};

	const set = (key: string, value: any) =>
		setConfig((prev) => ({ ...prev, [key]: value }));

	if (!widget) return null;

	const renderFields = () => {
		const type = widget.type;

		if (type === 'gap_trend' || type === 'concentration_trend') {
			return (
				<FormControl fullWidth>
					<InputLabel>Период</InputLabel>
					<ToggleButtonGroup
						value={config.days || 30}
						exclusive
						onChange={(_, v) => v && set('days', v)}
						fullWidth
					>
						{DAYS_OPTIONS.map((d) => (
							<ToggleButton key={d} value={d}>
								{d} дней
							</ToggleButton>
						))}
					</ToggleButtonGroup>
				</FormControl>
			);
		}

		if (type === 'comparison_bar') {
			return (
				<Stack spacing={2}>
					<FormControl fullWidth>
						<InputLabel>Дата 1</InputLabel>
						<Select
							value={config.date1 || ''}
							label="Дата 1"
							onChange={(e) => set('date1', e.target.value)}
						>
							{calcs.map((c) => (
								<MenuItem key={c.id} value={c.report_date}>
									{formatISODate(c.report_date)}
								</MenuItem>
							))}
						</Select>
					</FormControl>
					<FormControl fullWidth>
						<InputLabel>Дата 2</InputLabel>
						<Select
							value={config.date2 || ''}
							label="Дата 2"
							onChange={(e) => set('date2', e.target.value)}
						>
							{calcs.map((c) => (
								<MenuItem key={c.id} value={c.report_date}>
									{formatISODate(c.report_date)}
								</MenuItem>
							))}
						</Select>
					</FormControl>
				</Stack>
			);
		}

		if (type === 'report_table') {
			return (
				<Stack spacing={2}>
					<FormControl fullWidth>
						<InputLabel>Режим</InputLabel>
						<Select
							value={config.mode || 'concentration'}
							label="Режим"
							onChange={(e) => set('mode', e.target.value)}
						>
							<MenuItem value="concentration">Концентрация</MenuItem>
							<MenuItem value="gap">GAP</MenuItem>
						</Select>
					</FormControl>
					<FormControl fullWidth>
						<InputLabel>Дата</InputLabel>
						<Select
							value={config.reportDate || ''}
							label="Дата"
							onChange={(e) => set('reportDate', e.target.value)}
						>
							{calcs.map((c) => (
								<MenuItem key={c.id} value={c.report_date}>
									{formatISODate(c.report_date)}
								</MenuItem>
							))}
						</Select>
					</FormControl>
				</Stack>
			);
		}

		// gap_bar, concentration_pie, kpi_row — выбор даты
		return (
			<FormControl fullWidth>
				<InputLabel>Дата</InputLabel>
				<Select
					value={config.reportDate || ''}
					label="Дата"
					onChange={(e) => set('reportDate', e.target.value)}
				>
					{calcs.map((c) => (
						<MenuItem key={c.id} value={c.report_date}>
							{formatISODate(c.report_date)}
						</MenuItem>
					))}
				</Select>
			</FormControl>
		);
	};

	return (
		<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
			<DialogTitle>Настройка: {widget.title}</DialogTitle>
			<DialogContent>
				<Stack spacing={2} sx={{ mt: 1 }}>
					{renderFields()}
				</Stack>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Отмена</Button>
				<Button variant="contained" onClick={handleSave}>
					{mode === 'edit' ? 'Сохранить' : 'Применить'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}
