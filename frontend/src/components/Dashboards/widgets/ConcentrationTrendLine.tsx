'use client';

import { useState, useEffect, useMemo } from 'react';

import {
	Paper,
	Stack,
	Typography,
	CircularProgress,
	Alert,
	Tabs,
	Tab,
} from '@mui/material';

import { LineChart } from '@mui/x-charts/LineChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import { getCalculations, getConcentration } from '@/services/api';
import { formatISODate } from '@/utils/dateUtils';

const safe = (v: any, fallback = 0): number =>
	v != null && !isNaN(Number(v)) ? Number(v) : fallback;

const COLORS = [
	'#1976D2', '#388E3C', '#D32F2F', '#F57C00', '#7B1FA2',
	'#00796B', '#C2185B', '#FBC02D', '#5D4037', '#0097A7',
	'#9E9E9E',
];

const TOP_N = 10;

export default function ConcentrationTrendLine() {
	const [data, setData] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [category, setCategory] = useState<'asset' | 'liability'>('asset');
	const [tabValue, setTabValue] = useState(0);

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

			const seen = new Map<string, any>();
			concCalcs.forEach((c: any) => {
				const existing = seen.get(c.report_date);
				if (!existing || c.id > existing.id) seen.set(c.report_date, c);
			});
			const uniqueCalcs = Array.from(seen.values());

			const raw = (
				await Promise.all(
					uniqueCalcs.map(async (calc: any) => {
						try {
							const conc = await getConcentration(
								calc.report_date,
								category,
								calc.id
							);
							if (!conc?.items?.length) return null;
							return {
								date: calc.report_date,
								items: conc.items.map((item: any) => ({
									code: item.counterparty_code,
									name: item.counterparty_name,
									share: safe(item.share_pct),
								})),
							};
						} catch {
							return null;
						}
					})
				)
			).filter(Boolean) as {
				date: string;
				items: { code: string; name: string; share: number }[];
			}[];

			const valid = raw.filter((day) =>
				day.items.some((item) => item.share > 0)
			);

			setData(valid);
		} catch (err) {
			setError('Ошибка загрузки');
			console.error('ConcentrationTrendLine error:', err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, [category]);

	const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
		setTabValue(newValue);
		setCategory(newValue === 0 ? 'asset' : 'liability');
	};

	const { dates, seriesData } = useMemo(() => {
		if (!data.length) return { dates: [], seriesData: [] };

		const allCodes = new Map<string, string>();
		data.forEach((day) => {
			day.items.forEach((item: any) => {
				if (!allCodes.has(item.code)) {
					allCodes.set(item.code, item.name);
				}
			});
		});

		const totals = new Map<string, number>();
		data.forEach((day) => {
			day.items.forEach((item: any) => {
				totals.set(item.code, (totals.get(item.code) || 0) + item.share);
			});
		});

		const sorted = Array.from(allCodes.entries())
			.map(([code, name]) => ({ code, name, total: totals.get(code) || 0 }))
			.sort((a, b) => b.total - a.total);

		const top = sorted.slice(0, TOP_N);
		const topCodes = new Set(top.map((c) => c.code));

		if (sorted.length > TOP_N) {
			top.push({ code: '__rest__', name: 'Остальные', total: 0 });
		}

		const series = top.map((cp) => {
			const shares = data.map((day) => {
				if (cp.code === '__rest__') {
					const rest = day.items
						.filter((item: any) => !topCodes.has(item.code))
						.reduce((sum: number, item: any) => sum + item.share, 0);
					return rest;
				}
				const found = day.items.find((item: any) => item.code === cp.code);
				return found ? found.share : 0;
			});
			return { label: cp.name, data: shares };
		});

		// Percent Area — нормализация до 100% на каждую дату
		const normalizedSeries = series.map((s) => ({
			...s,
			data: s.data.map((_, i) => {
				const totalAtDate = series.reduce(
					(sum, ss) => sum + (ss.data[i] || 0),
					0
				);
				return totalAtDate > 0 ? (s.data[i] / totalAtDate) * 100 : 0;
			}),
		}));

		const dates = data.map((d) => formatISODate(d.date));

		return { dates, seriesData: normalizedSeries };
	}, [data]);

	return (
		<Stack spacing={2} sx={{ width: '100%', height: '100%' }}>
			{loading && <CircularProgress />}
			{error && <Alert severity="error">{error}</Alert>}
			{!loading && !error && data.length === 0 && (
				<Alert severity="info">Нет данных</Alert>
			)}
			{!loading && !error && data.length > 1 && (
				<Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
					<Stack spacing={2}>
						<Stack
							direction="row"
							alignItems="center"
							justifyContent="space-between"
						>
							<Stack direction="row" alignItems="center" spacing={1}>
								<TimelineIcon />
								<Typography variant="h6">
									Концентрация по датам
								</Typography>
							</Stack>
							<Tabs value={tabValue} onChange={handleTabChange}>
								<Tab label="Активы" />
								<Tab label="Обязательства" />
							</Tabs>
						</Stack>
						<LineChart
							xAxis={[
								{
									scaleType: 'point',
									data: dates,
									tickLabelStyle: { fontSize: 10 },
								},
							]}
							yAxis={[
								{
									min: 0,
									max: 100,
									valueFormatter: (v: number) => `${v.toFixed(0)}%`,
								},
							]}
							series={seriesData.map((s, i) => ({
								...s,
								stack: 'total',
								area: true,
								color: COLORS[i % COLORS.length],
							}))}
							height={350}
							slotProps={{
								legend: {
									direction: 'column',
									position: {
										vertical: 'middle',
										horizontal: 'right',
									},
								},
							}}
						/>
					</Stack>
				</Paper>
			)}
		</Stack>
	);
}
