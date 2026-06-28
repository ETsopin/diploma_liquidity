'use client';

import { useState, useEffect } from 'react';

import {
	Paper,
	Stack,
	Typography,
	CircularProgress,
	Alert,
	ToggleButton,
	ToggleButtonGroup,
} from '@mui/material';

import { LineChart } from '@mui/x-charts/LineChart';

import TimelineIcon from '@mui/icons-material/Timeline';

import { formatISODate } from '@/utils/dateUtils';

const DAYS_OPTIONS = [7, 14, 30];

export default function SystemTimelineChart() {
	const [data, setData] = useState<
		{ date: string; total: number; etl: number; report: number; calculation: number }[]
	>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [days, setDays] = useState(14);

	const fetchData = async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await fetch(`/api/admin/stats/timeline?days=${days}`);
			if (!res.ok) throw new Error('Ошибка загрузки');
			const json = await res.json();
			setData(json.items || []);
		} catch (err) {
			setError('Ошибка загрузки данных');
			console.error('SystemTimelineChart fetch error:', err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, [days]);

	const dates = data.map((item) => formatISODate(item.date));
	const etlSeries = data.map((item) => item.etl);
	const reportSeries = data.map((item) => item.report);
	const calculationSeries = data.map((item) => item.calculation);

	const total = data.reduce((sum, item) => sum + item.total, 0);

	return (
		<Stack spacing={2} sx={{ width: '100%', height: '100%' }}>
			<Stack direction="row" alignItems="center" spacing={1}>
				<TimelineIcon />
				<Typography variant="h5">Динамика операций</Typography>
			</Stack>

			{loading && (
				<Stack
					sx={{
						width: '100%',
						height: '100%',
					}}
					alignItems='center'
					justifyContent='center'
				>
					<CircularProgress />
				</Stack>
			)}
			{error && <Alert severity="error">{error}</Alert>}

			{!loading && !error && data.length === 0 && (
				<Alert severity="info">Нет данных за выбранный период</Alert>
			)}

			{!loading && !error && data.length > 0 && (
				<Paper 
					variant="outlined"
				   	sx={{ width: '100%', height: '100%', p: 3 }}
				>
					<Stack spacing={2}>
						<Stack
							direction="row"
							alignItems="center"
							justifyContent="space-between"
						>
							<ToggleButtonGroup
								value={days}
								exclusive
								onChange={(_, v) => v && setDays(v)}
								size="small"
							>
								{DAYS_OPTIONS.map((d) => (
									<ToggleButton key={d} value={d}>
										{d} {d === 1 ? 'день' : 'дней'}
									</ToggleButton>
								))}
							</ToggleButtonGroup>
							<Typography variant="h6">
								<strong>Всего:</strong> {total}
							</Typography>
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
								{ data: etlSeries, label: 'ETL', color: '#1976D2' },
								{ data: reportSeries, label: 'Отчёты', color: '#388E3C' },
								{
									data: calculationSeries,
									label: 'Расчёты',
									color: '#F57C00',
								},
							]}
							height={350}
							slotProps={{
								legend: { direction: 'row', position: { vertical: 'top', horizontal: 'middle' } },
							}}
						/>
					</Stack>
				</Paper>
			)}
		</Stack>
	);
}
