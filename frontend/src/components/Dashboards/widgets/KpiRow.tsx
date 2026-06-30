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
import { formatISODate } from '@/utils/dateUtils';

import AnalyticsIcon from '@mui/icons-material/Analytics';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import BalanceIcon from '@mui/icons-material/Balance';
import AssignmentIcon from '@mui/icons-material/Assignment';

const safe = (v: any, fallback = 0): number =>
	v != null && !isNaN(Number(v)) ? Number(v) : fallback;

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

			// дедупликация — по дате оставляем расчёт с макс. id
			const seen = new Map<string, any>();
			items.forEach((c: any) => {
				const existing = seen.get(c.report_date);
				if (!existing || c.id > existing.id) {
					seen.set(c.report_date, c);
				}
			});
			const uniqueDates = Array.from(seen.values());

			// проверяем — есть ли данные за каждую дату
			const withData = (
				await Promise.all(
					uniqueDates.map(async (c: any) => {
						try {
							const gap = await getGapAnalysis(c.report_date);
							return gap &&
								safe(gap.total_assets) > 0 &&
								safe(gap.total_liabilities) > 0
								? c
								: null;
						} catch {
							return null;
						}
					})
				)
			).filter(Boolean);

			setCalcs(withData);
			if (withData.length > 0)
				setSelectedDate(withData[withData.length - 1].report_date);
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
				{
					label: 'Всего активов',
					value: safe(data.total_assets / 1e9).toFixed(2),
					unit: 'млрд ₽',
					icon: AccountBalanceIcon,
				},
				{
					label: 'Всего обязательств',
					value: safe(data.total_liabilities / 1e9).toFixed(2),
					unit: 'млрд ₽',
					icon: AccountBalanceWalletIcon,
				},
				{
					label: 'Нет-ГЭП',
					value: safe(data.net_gap / 1e9).toFixed(2),
					unit: 'млрд ₽',
					color: safe(data.net_gap) >= 0 ? 'success.main' : 'error.main',
					icon: BalanceIcon,
				},
				{
					label: 'Корзин',
					value: safe(data.buckets?.length),
					unit: '',
					icon: AssignmentIcon,
				},
		  ]
		: [];

	return (
		<Stack spacing={1} sx={{ width: '100%', height: '100%' }}>
			<Stack direction="row" alignItems="center" spacing={2}>
				<Stack direction="row" alignItems="center" spacing={1}>
					<AnalyticsIcon />
					<Typography variant="h5">Ключевые метрики</Typography>
				</Stack>
				<FormControl size="small" sx={{ minWidth: 180 }}>
					<Select
						value={selectedDate}
						onChange={(e) => setSelectedDate(e.target.value)}
					>
						{calcs.map((c) => (
							<MenuItem key={c.id} value={c.report_date}>
								{formatISODate(c.report_date)}
							</MenuItem>
						))}
					</Select>
				</FormControl>
			</Stack>
			<Stack direction="row" spacing={2} sx={{height: '100%'}}>
				{metrics.map((m) => (
					<Paper
						key={m.label}
						variant="outlined"
						sx={{ flex: '1 1 140px', p: 2 }}
					>
						<Stack
							direction="row"
							alignItems="center"
							spacing={2}
							sx={{ height: '100%' }}
						>
							<m.icon fontSize="large" />
							<Stack direction="column">
								<Typography variant="body2" color="text.secondary">
									{m.label}
								</Typography>
								<Typography
									variant="h5"
									fontWeight={700}
									color={m.color || 'text.primary'}
								>
									{m.value}
								</Typography>
								<Typography variant="caption" color="text.secondary">
									{m.unit}
								</Typography>
							</Stack>
						</Stack>
					</Paper>
				))}
			</Stack>
		</Stack>
	);
}
