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
import { getCalculations, getConcentration } from '@/services/api';
import { formatISODate } from '@/utils/dateUtils';

export default function ConcentrationTrendLine() {
	const [data, setData] = useState<{ date: string; top5share: number }[]>([]);
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

			const concCalcs = calcs.items.filter(
				(c: any) => c.calc_type === 'concentration' || c.calc_type === 'full'
			);

			const results = (
				await Promise.all(
					concCalcs.map(async (calc: any) => {
						try {
							const conc = await getConcentration(calc.report_date, 'asset', calc.id);
							if (!conc?.items?.length) return null;
							const sorted = [...conc.items].sort(
								(a, b) => b.share_pct - a.share_pct
							);
							const top5share = sorted
								.slice(0, 5)
								.reduce((sum, item) => sum + item.share_pct, 0);
							return { date: calc.report_date, top5share };
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
			console.error('ConcentrationTrendLine error:', err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	const dates = data.map((d) => formatISODate(d.date));
	const values = data.map((d) => d.top5share);

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
						<Typography variant="h6">Доли контрагентов</Typography>
					</Stack>

					<LineChart
						xAxis={[{ scaleType: 'point', data: dates, tickLabelStyle: { fontSize: 10 } }]}
						series={[{ data: values, label: 'Топ-5, %', color: '#388E3C' }]}
						height={300}
					/>
				</Paper>
			)}
		</Stack>
	);
}
