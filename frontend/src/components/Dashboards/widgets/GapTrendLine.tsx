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
	const [data, setData] = useState<{ date: string; netGap: number }[]>([]);
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

			const results = (
				await Promise.all(
					gapCalcs.map(async (calc: any) => {
						try {
							const gap = await getGapAnalysis(calc.report_date, calc.id);
							return gap ? { date: calc.report_date, netGap: gap.net_gap } : null;
						} catch {
							return null;
						}
					})
				)
			)
				.filter(Boolean)
				.sort((a: any, b: any) => a.date.localeCompare(b.date));

			setData(results as any);
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

	const dates = data.map((d) => formatISODate(d.date));
	const values = data.map((d) => d.netGap);

	return (
		<Stack spacing={2} sx={{ width: '100%' }}>

			{loading && <CircularProgress />}
			{error && <Alert severity="error">{error}</Alert>}
			{!loading && !error && data.length === 0 && (
				<Alert severity="info">Нет данных</Alert>
			)}
			{!loading && !error && data.length > 1 && (
				<Paper variant="outlined" sx={{ p: 2 }}>
					<Stack direction="row" alignItems="center" spacing={1}>
						<TimelineIcon />
						<Typography variant="h6">Динамика чистого GAP</Typography>
					</Stack>
						<LineChart
						xAxis={[{ scaleType: 'point', data: dates, tickLabelStyle: { fontSize: 10 } }]}
						series={[{ data: values, label: 'Net GAP', color: '#1976D2' }]}
						height={300}
					/>
				</Paper>
			)}
		</Stack>
	);
}
