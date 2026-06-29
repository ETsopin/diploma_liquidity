'use client';

import { useState, useEffect } from 'react';
import {
	Paper,
	Stack,
	Typography,
	CircularProgress,
	Alert,
} from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import { getCalculations, getGapAnalysis } from '@/services/api';
import { formatISODate } from '@/utils/dateUtils';

export default function GapTrendLine() {
	const [data, setData] = useState<
		{ date: string; assets: number; liabilities: number; netGap: number }[]
	>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchData = async () => {
		setLoading(true);
		setError(null);
		try {
			const calcs = await getCalculations(50, 0);
			if (!calcs?.items?.length) {
				setData([]);
				return;
			}

			const gapCalcs = calcs.items.filter(
				(c: any) => c.calc_type === 'gap' || c.calc_type === 'full'
			);

			const raw = (
				await Promise.all(
					gapCalcs.map(async (calc: any) => {
						try {
							const gap = await getGapAnalysis(calc.report_date, calc.id);
							return gap
								? {
										date: calc.report_date,
										assets: Number(gap.total_assets) || 0,
										liabilities: Number(gap.total_liabilities) || 0,
										netGap: Number(gap.net_gap) || 0,
								  }
								: null;
						} catch {
							return null;
						}
					})
				)
			).filter(Boolean) as { date: string; assets: number; liabilities: number; netGap: number }[];

			const grouped = Object.values(
				raw.reduce((acc: Record<string, any>, item) => {
					if (!acc[item.date]) {
						acc[item.date] = { ...item };
					} else {
						acc[item.date].assets = Math.max(acc[item.date].assets, item.assets);
						acc[item.date].liabilities = Math.max(acc[item.date].liabilities, item.liabilities);
						acc[item.date].netGap = Math.max(acc[item.date].netGap, item.netGap);
					}
					return acc;
				}, {})
			).sort((a: any, b: any) => a.date.localeCompare(b.date));

			const valid = grouped.filter((item: any) =>
				[item.assets, item.liabilities, item.netGap].some(
					(v: any) => v != null && !isNaN(Number(v))
				)
			);

			setData(valid as any);
		} catch (err) {
			setError('Ошибка загрузки');
			console.error('GapTrendLine error:', err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	const safe = (v: any) => (v != null && !isNaN(Number(v)) ? v : 0);

	const dates = data.map((d) => formatISODate(d.date));
	const assetsLine = data.map((d) => safe(d.assets) / 1e9);
	const liabilitiesLine = data.map((d) => safe(d.liabilities) / 1e9);
	const netGapLine = data.map((d) => safe(d.netGap) / 1e9);

	return (
		<Stack spacing={2} sx={{ width: '100%', height:'100%' }}>
			{loading && <CircularProgress />}
			{error && <Alert severity="error">{error}</Alert>}
			{!loading && !error && data.length === 0 && (
				<Alert severity="info">Нет данных</Alert>
			)}
			{!loading && !error && data.length > 1 && (
				<Paper variant="outlined" sx={{ p: 2, height: '100%'}}>
					<Stack direction="row" alignItems="center" spacing={1}>
						<TimelineIcon />
						<Typography variant="h6">Динамика ГЭП</Typography>
					</Stack>
					<LineChart
						xAxis={[
							{
								scaleType: 'point',
								data: dates,
								tickLabelStyle: { fontSize: 10 },
							},
						]}
						series={[
							{ data: assetsLine, label: 'Активы', color: '#1976D2' },
							{ data: liabilitiesLine, label: 'Обязательства', color: '#D32F2F' },
							{ data: netGapLine, label: 'Нет-ГЭП', color: '#388E3C' },
						]}
						height={300}
					/>
				</Paper>
			)}
		</Stack>
	);
}
