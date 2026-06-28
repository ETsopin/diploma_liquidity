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

export default function ReportTable() {
	const [calcs, setCalcs] = useState<any[]>([]);
	const [selectedDate, setSelectedDate] = useState<string>('');
	const [mode, setMode] = useState<'concentration' | 'gap'>('concentration');
	const [data, setData] = useState<any>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		(async () => {
			const res = await getCalculations(50, 0);
			setCalcs(res?.items || []);
			if (res?.items?.length > 0) setSelectedDate(res.items[res.items.length - 1].report_date);
			setLoading(false);
		})();
	}, []);

	useEffect(() => {
		if (!selectedDate) return;
		(async () => {
			setLoading(true);
			try {
				const result = mode === 'concentration'
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

	return (
		<Stack spacing={1} sx={{ width: '100%' }}>
			<Stack direction="row" alignItems="center" spacing={2}>
				<TableChartIcon />
				<Typography variant="h6">Таблица отчёта</Typography>
				<FormControl size="small" sx={{ minWidth: 140 }}>
					<Select value={mode} onChange={(e) => setMode(e.target.value as any)}>
						<MenuItem value="concentration">Концентрация</MenuItem>
						<MenuItem value="gap">GAP</MenuItem>
					</Select>
				</FormControl>
				<FormControl size="small" sx={{ minWidth: 180 }}>
					<Select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}>
						{calcs.map((c) => (
							<MenuItem key={c.id} value={c.report_date}>{c.report_date}</MenuItem>
						))}
					</Select>
				</FormControl>
			</Stack>

			{loading && <CircularProgress />}

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
									<TableCell align="right">{(item.amount_rub / 1e9).toFixed(2)}</TableCell>
									<TableCell align="right">{item.share_pct.toFixed(1)}</TableCell>
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
								<TableCell align="right">GAP, млрд ₽</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{data.buckets.map((b: any, i: number) => (
								<TableRow key={i}>
									<TableCell>{b.bucket_name}</TableCell>
									<TableCell align="right">{(b.total_assets_rub / 1e9).toFixed(2)}</TableCell>
									<TableCell align="right">{(b.total_liabilities_rub / 1e9).toFixed(2)}</TableCell>
									<TableCell align="right">{(b.gap_rub / 1e9).toFixed(2)}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
			)}
		</Stack>
	);
}
