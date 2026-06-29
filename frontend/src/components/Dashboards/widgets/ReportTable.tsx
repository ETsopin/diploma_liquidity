'use client';

import { useState, useEffect } from 'react';
import {
	Paper,
	Stack,
	Typography,
	CircularProgress,
	Alert,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Select,
	MenuItem,
	FormControl,
	InputLabel,
} from '@mui/material';
import TableChartIcon from '@mui/icons-material/TableChart';
import { getCalculations, getConcentration, getGapAnalysis } from '@/services/api';
import { formatISODate } from '@/utils/dateUtils';

const safe = (v: any, fallback = 0): number =>
	v != null && !isNaN(Number(v)) ? Number(v) : fallback;

const fmt = (v: number, digits = 2): string =>
	v ? v.toFixed(digits) : '—';

export default function ReportTable() {
	const [calcs, setCalcs] = useState<any[]>([]);
	const [selectedDate, setSelectedDate] = useState<string>('');
	const [mode, setMode] = useState<'concentration' | 'gap'>('concentration');
	const [data, setData] = useState<any>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		(async () => {
			const res = await getCalculations(50, 0);

			// дедупликация по дате — макс. id
			const seen = new Map<string, any>();
			(res?.items || []).forEach((c: any) => {
				const existing = seen.get(c.report_date);
				if (!existing || c.id > existing.id)
					seen.set(c.report_date, c);
			});
			const uniqueCalcs = Array.from(seen.values());

			setCalcs(uniqueCalcs);
			if (uniqueCalcs.length > 0)
				setSelectedDate(uniqueCalcs[uniqueCalcs.length - 1].report_date);
			setLoading(false);
		})();
	}, []);

	useEffect(() => {
		if (!selectedDate) return;
		(async () => {
			setLoading(true);
			try {
				const result =
					mode === 'concentration'
						? await getConcentration(selectedDate, 'asset')
						: await getGapAnalysis(selectedDate);
				setData(result);
			} catch {
				setData(null);
			} finally {
				setLoading(false);
			}
		})();
	}, [selectedDate, mode]);

	const hasData = data && (data.items?.length || data.buckets?.length);

	return (
		<Stack spacing={1} sx={{ width: '100%' }}>
			<Stack direction="row" alignItems="center" spacing={2}>
				<Stack direction="row" alignItems="center" spacing={1}>
					<TableChartIcon />
					<Typography variant="h6">Информация об отчете</Typography>
				</Stack>
				<FormControl size="small" sx={{ minWidth: 140 }}>
					<Select
						value={mode}
						onChange={(e) => setMode(e.target.value as any)}
					>
						<MenuItem value="concentration">Концентрация</MenuItem>
						<MenuItem value="gap">ГЭП</MenuItem>
					</Select>
				</FormControl>
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
			{!loading && !hasData && (
				<Alert severity="info">Нет данных за выбранную дату</Alert>
			)}

			{!loading && mode === 'concentration' && data?.items && (
				<TableContainer component={Paper} variant="outlined">
					<Table size="small">
						<TableHead>
							<TableRow>
								<TableCell>Контрагент</TableCell>
								<TableCell align="right">Сумма, млрд ₽</TableCell>
								<TableCell align="right">Доля, %</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{data.items.map((item: any, i: number) => (
								<TableRow key={i}>
									<TableCell>{item.counterparty_name}</TableCell>
									<TableCell align="right">
										{fmt(safe(item.amount_rub) / 1e9)}
									</TableCell>
									<TableCell align="right">
										{fmt(safe(item.share_pct), 1)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
			)}

			{!loading && mode === 'gap' && data?.buckets && (
				<TableContainer component={Paper} variant="outlined">
					<Table size="small">
						<TableHead>
							<TableRow>
								<TableCell>Корзина</TableCell>
								<TableCell align="right">Активы, млрд ₽</TableCell>
								<TableCell align="right">Обязательства, млрд ₽</TableCell>
								<TableCell align="right">ГЭП, млрд ₽</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{data.buckets.map((b: any, i: number) => (
								<TableRow key={i}>
									<TableCell>{b.bucket_name}</TableCell>
									<TableCell align="right">
										{fmt(safe(b.total_assets_rub) / 1e9)}
									</TableCell>
									<TableCell align="right">
										{fmt(safe(b.total_liabilities_rub) / 1e9)}
									</TableCell>
									<TableCell align="right">
										{fmt(safe(b.gap_rub) / 1e9)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
			)}
		</Stack>
	);
}
