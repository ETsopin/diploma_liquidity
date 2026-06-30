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
	Divider,
} from '@mui/material';

import { BarChart } from '@mui/x-charts/BarChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import { getCalculations, getGapAnalysis } from '@/services/api';
import { formatISODate } from '@/utils/dateUtils';

const safe = (v: any, fallback = 0): number =>
	v != null && !isNaN(Number(v)) ? Number(v) : fallback;

export default function GapBarWidget() {
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

			// дедупликация — по дате макс. id
			const seen = new Map<string, any>();
			items.forEach((c: any) => {
				const existing = seen.get(c.report_date);
				if (!existing || c.id > existing.id)
					seen.set(c.report_date, c);
			});
			const uniqueCalcs = Array.from(seen.values());

			// проверяем — есть ли данные за дату
			const withData = (
				await Promise.all(
					uniqueCalcs.map(async (c: any) => {
						try {
							const gap = await getGapAnalysis(c.report_date);
							return gap && safe(gap.total_assets) > 0 ? c : null;
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
			setLoading(true);
			try {
				const result = await getGapAnalysis(selectedDate);
				setData(result);
			} catch {
				setData(null);
			} finally {
				setLoading(false);
			}
		})();
	}, [selectedDate]);

	const bucketNames = data?.buckets
		? data.buckets.map((b: any) => b.bucket_name)
		: [];

	const assets = data?.buckets
		? data.buckets.map((b: any) => safe(b.total_assets_rub) / 1e9)
		: [];

	const liabilities = data?.buckets
		? data.buckets.map((b: any) => safe(b.total_liabilities_rub) / 1e9)
		: [];

	const totalAssets = safe(data?.total_assets) / 1e9;
	const totalLiabilities = safe(data?.total_liabilities) / 1e9;
	const netGapVal = safe(data?.net_gap) / 1e9;

	const hasBuckets = data?.buckets?.length > 0;

	return (
		<Stack spacing={2} sx={{ width: '100%', height: '100%' }}>
			<Stack direction="row" alignItems="center" spacing={2}>
				<Stack direction="row" alignItems="center" spacing={1}>
					<TimelineIcon />
					<Typography variant="h6">ГЭП-анализ</Typography>
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

			{loading && <CircularProgress />}

			{!loading && !hasBuckets && (
				<Alert severity="info">
					Нет данных за {formatISODate(selectedDate)}
				</Alert>
			)}

			{!loading && hasBuckets && (
				<Paper variant="outlined" sx={{ p: 3, width: '100%', height: '100%' }}>
					<Stack direction="column" spacing={3}>
						<Stack
							direction="row"
							spacing={2}
							alignItems="center"
							justifyContent="center"
						>
							<Typography variant="body1">
								<strong>Активы:</strong>{' '}
								{totalAssets ? totalAssets.toFixed(2) : '—'} млрд ₽
							</Typography>
							<Typography variant="body1">
								<strong>Обязательства:</strong>{' '}
								{totalLiabilities ? totalLiabilities.toFixed(2) : '—'} млрд ₽
							</Typography>
							<Typography
								variant="body1"
								color={netGapVal >= 0 ? 'success.main' : 'error.main'}
							>
								<strong>Нет-ГЭП:</strong>{' '}
								{netGapVal ? netGapVal.toFixed(2) : '—'} млрд ₽
							</Typography>
						</Stack>
						<Divider />
						<BarChart
							xAxis={[
								{
									data: bucketNames,
									scaleType: 'band',
									label: 'Временные корзины',
								},
							]}
							series={[
								{
									data: assets,
									label: 'Активы, млрд ₽',
									color: '#4C662B',
								},
								{
									data: liabilities,
									label: 'Обязательства, млрд ₽',
									color: '#D32F2F',
								},
							]}
							height={400}
						/>
					</Stack>
				</Paper>
			)}
		</Stack>
	);
}
