'use client';

import { useState, useEffect } from 'react';

import {
	Paper,
	Stack,
	Typography,
	CircularProgress,
	Alert,
	Divider,
	Tabs,
	Tab,
	Select,
	MenuItem,
	FormControl,
} from '@mui/material';

import { PieChart } from '@mui/x-charts/PieChart';
import PercentIcon from '@mui/icons-material/Percent';
import { getCalculations, getConcentration } from '@/services/api';
import { formatISODate } from '@/utils/dateUtils';

const safe = (v: any, fallback = 0): number =>
	v != null && !isNaN(Number(v)) ? Number(v) : fallback;

export default function ConcentrationPieWidget() {
	const [calcs, setCalcs] = useState<any[]>([]);
	const [selectedDate, setSelectedDate] = useState<string>('');
	const [data, setData] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [category, setCategory] = useState<'asset' | 'liability'>('asset');
	const [tabValue, setTabValue] = useState(0);

	useEffect(() => {
		(async () => {
			const res = await getCalculations(50, 0);
			const items = (res?.items || []).filter(
				(c: any) => c.calc_type === 'concentration' || c.calc_type === 'full'
			);

			// дедупликация по дате — макс. id
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
							const conc = await getConcentration(
								c.report_date,
								'asset',
								c.id
							);
							return conc?.items?.length ? c : null;
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
			setError(null);
			try {
				const result = await getConcentration(selectedDate, category);
				setData(result);
			} catch {
				setError('Ошибка загрузки');
			} finally {
				setLoading(false);
			}
		})();
	}, [selectedDate, category]);

	const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
		setTabValue(newValue);
		setCategory(newValue === 0 ? 'asset' : 'liability');
	};

	const aggregatedPieData =
		data?.items
			? Object.values(
					data.items.reduce((acc: any, item: any) => {
						const existing = acc.find(
							(el: any) => el.counterparty_code === item.counterparty_code
						);
						if (existing) {
							existing.amount_rub += item.amount_rub;
							existing.share_pct += item.share_pct;
						} else {
							acc.push({
								counterparty_code: item.counterparty_code,
								counterparty_name: item.counterparty_name,
								amount_rub: item.amount_rub,
								share_pct: item.share_pct,
							});
						}
						return acc;
					}, [])
			  ).map((item: any, index: number) => ({
					id: index,
					label: `${item.counterparty_name} (${safe(item.share_pct).toFixed(1)}%)`,
					value: safe(item.amount_rub) / 1e9,
			  }))
			: [];

	const totalAmount = safe(data?.total_amount) / 1e9;
	const counterpartyCount = aggregatedPieData.length;

	return (
		<Stack spacing={2} sx={{ width: '100%', height: '100%' }}>
			<Stack direction="row" alignItems="center" spacing={2}>
				<Stack direction="row" alignItems="center" spacing={1}>
					<PercentIcon />
					<Typography variant="h6">Концентрация</Typography>
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
			{error && <Alert severity="error">{error}</Alert>}

			{!loading && !error && aggregatedPieData.length === 0 && (
				<Alert severity="info">
					Нет данных за {formatISODate(selectedDate)}
				</Alert>
			)}

			{!loading && !error && aggregatedPieData.length > 0 && (
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
							<Tabs value={tabValue} onChange={handleTabChange}>
								<Tab label="Активы" />
								<Tab label="Обязательства" />
							</Tabs>
							<Stack direction="row" spacing={1}>
								<Typography variant="h6">
									<strong>Всего:</strong>{' '}
									{totalAmount ? totalAmount.toFixed(2) : '—'} млрд ₽
								</Typography>
								<Typography variant="h6">
									<strong>Контрагентов:</strong> {counterpartyCount}
								</Typography>
							</Stack>
						</Stack>
						<Divider />
						<PieChart
							series={[
								{
									data: aggregatedPieData,
									outerRadius: 120,
									paddingAngle: 2,
									cornerRadius: 4,
									highlightScope: { fade: 'global', highlight: 'item' },
								},
							]}
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
