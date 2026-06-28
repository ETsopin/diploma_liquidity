'use client';

import { useState, useEffect } from 'react';
import {
	Paper,
	Stack,
	Typography,
	CircularProgress,
	Alert,
	Select,
	MenuItem,
	FormControl,
	InputLabel,
} from '@mui/material';
import { getCalculations, getGapAnalysis } from '@/services/api';

export default function KpiRow() {
	const [calcs, setCalcs] = useState<any[]>([]);
	const [selectedDate, setSelectedDate] = useState<string>('');
	const [data, setData] = useState<any>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		(async () => {
			const res = await getCalculations(50, 0);
			const items = (res?.items || []).filter(
				(c: any) => c.calc_type === 'gap' || c.calc_type === 'full'
			);
			setCalcs(items);
			if (items.length > 0) setSelectedDate(items[items.length - 1].report_date);
			setLoading(false);
		})();
	}, []);

	useEffect(() => {
		if (!selectedDate) return;
		(async () => {
			const result = await getGapAnalysis(selectedDate);
			setData(result);
		})();
	}, [selectedDate]);

	if (loading) return <CircularProgress />;

	const metrics = data
		? [
				{ label: 'Всего активов', value: (data.total_assets / 1e9).toFixed(2), unit: 'млрд ₽' },
				{ label: 'Всего обязательств', value: (data.total_liabilities / 1e9).toFixed(2), unit: 'млрд ₽' },
				{ label: 'Net GAP', value: (data.net_gap / 1e9).toFixed(2), unit: 'млрд ₽', color: data.net_gap >= 0 ? 'success.main' : 'error.main' },
				{ label: 'Корзин', value: data.buckets?.length || 0, unit: '' },
		  ]
		: [];

	return (
		<Stack spacing={1} sx={{ width: '100%' }}>
			<Stack direction="row" alignItems="center" spacing={2}>
				<Typography variant="h6">Ключевые метрики</Typography>
				<FormControl size="small" sx={{ minWidth: 180 }}>
					<Select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}>
						{calcs.map((c) => (
							<MenuItem key={c.id} value={c.report_date}>
								{c.report_date}
							</MenuItem>
						))}
					</Select>
				</FormControl>
			</Stack>
			<Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 1 }}>
				{metrics.map((m) => (
					<Paper key={m.label} variant="outlined" sx={{ flex: '1 1 140px', p: 2 }}>
						<Typography variant="body2" color="text.secondary">{m.label}</Typography>
						<Typography variant="h5" fontWeight={700} color={m.color || 'text.primary'}>
							{m.value}
						</Typography>
						<Typography variant="caption" color="text.secondary">{m.unit}</Typography>
					</Paper>
				))}
			</Stack>
		</Stack>
	);
}
