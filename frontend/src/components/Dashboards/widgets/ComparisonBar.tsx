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
import { BarChart } from '@mui/x-charts/BarChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import { getCalculations, getGapAnalysis } from '@/services/api';

export default function ComparisonBar() {
	const [calcs, setCalcs] = useState<any[]>([]);
	const [date1, setDate1] = useState<string>('');
	const [date2, setDate2] = useState<string>('');
	const [data1, setData1] = useState<any>(null);
	const [data2, setData2] = useState<any>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		(async () => {
			const res = await getCalculations(50, 0);
			const items = (res?.items || []).filter(
				(c: any) => c.calc_type === 'gap' || c.calc_type === 'full'
			);
			setCalcs(items);
			if (items.length >= 2) {
				setDate1(items[items.length - 2].report_date);
				setDate2(items[items.length - 1].report_date);
			} else if (items.length === 1) {
				setDate1(items[0].report_date);
			}
			setLoading(false);
		})();
	}, []);

	useEffect(() => {
		if (!date1 && !date2) return;
		(async () => {
			const [r1, r2] = await Promise.all([
				date1 ? getGapAnalysis(date1) : null,
				date2 ? getGapAnalysis(date2) : null,
			]);
			setData1(r1);
			setData2(r2);
		})();
	}, [date1, date2]);

	if (loading) return <CircularProgress />;

	const labels = ['Активы', 'Обязательства', 'Net GAP'];
	const series1 = data1
		? [
				data1.total_assets / 1e9,
				data1.total_liabilities / 1e9,
				data1.net_gap / 1e9,
		  ]
		: [];
	const series2 = data2
		? [
				data2.total_assets / 1e9,
				data2.total_liabilities / 1e9,
				data2.net_gap / 1e9,
		  ]
		: [];

	return (
		<Stack spacing={2} sx={{ width: '100%' }}>
			<Stack direction="row" alignItems="center" spacing={1}>
				<BarChartIcon />
				<Typography variant="h6">Сравнение GAP</Typography>
			</Stack>

			<Stack direction="row" spacing={2}>
				<FormControl size="small" sx={{ minWidth: 180 }}>
					<InputLabel>Дата 1</InputLabel>
					<Select value={date1} label="Дата 1" onChange={(e) => setDate1(e.target.value)}>
						{calcs.map((c) => (
							<MenuItem key={c.id} value={c.report_date}>
								{c.report_date}
							</MenuItem>
						))}
					</Select>
				</FormControl>
				<FormControl size="small" sx={{ minWidth: 180 }}>
					<InputLabel>Дата 2</InputLabel>
					<Select value={date2} label="Дата 2" onChange={(e) => setDate2(e.target.value)}>
						{calcs.map((c) => (
							<MenuItem key={c.id} value={c.report_date}>
								{c.report_date}
							</MenuItem>
						))}
					</Select>
				</FormControl>
			</Stack>

			{data1 && data2 && (
				<Paper variant="outlined" sx={{ p: 2 }}>
					<BarChart
						xAxis={[{ scaleType: 'band', data: labels }]}
						series={[
							{ data: series1, label: date1, color: '#1976D2' },
							{ data: series2, label: date2, color: '#F57C00' },
						]}
						height={300}
					/>
				</Paper>
			)}
		</Stack>
	);
}
