'use client';

import { useState, useEffect } from 'react';

import { 
	Paper,
   	Stack, 
	Typography,
   	IconButton,
   	TextField, 
	CircularProgress,
   	Alert,
	Divider,	
	Tabs,
	Tab,
} from '@mui/material';

import { PieChart } from '@mui/x-charts/PieChart';

import PercentIcon from '@mui/icons-material/Percent';

import { getConcentration } from '@/services/api';
import { getLatestReportDate } from '@/services/latest';
import { formatISODate} from '@/utils/dateUtils';
import { ConcentrationResponse } from '@/types';

export default function ConcentrationPie() {
	const [data, setData] = useState<ConcentrationResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [reportDate, setReportDate] = useState<string | null>(null);
	const [category, setCategory] = useState<'liability' | 'asset'>('asset');
	const [tabValue, setTabValue] = useState(0);
	
	const fetchData = async () => {
		setLoading(true);
		try {
			const response = await getConcentration(reportDate, category);
			setData(response);
			console.log('Concentration response:', response);
			setError(null);
		} catch (err) {
			setError('Ошибка загрузки');
			console.log('Concentration Fetch Failed:', err);
		} finally {
			setLoading(false);
		}
	};

	const loadLatestDate = async () => {
		const latestDate = await getLatestReportDate('concentration');
		if (latestDate) setReportDate(latestDate);
	}
	
	useEffect(() => {
		loadLatestDate();
	}, []);
	
	useEffect(() => {
		if (reportDate) fetchData();
	}, [reportDate, category]);

	const handleTabChange = (
		event: React.SyntheticEvent,
	   	newValue: number
	) => {
		setTabValue(newValue);
		setCategory(newValue === 0 ? 'asset' : 'liability');
	}
	
	// const pieData = (data && data.items) ? data.items.map((item, index) => ({
	// 	id: index,
	// 	label: `${item.counterparty_name} (${item.share_pct.toFixed(1)}%) `,
	// 	value: item.amount_rub / 1e9,
	// })) : [];

	const aggregatedPieData = (data && data.items)
		? data.items
			.reduce((acc, item) => {
				const existing = acc.find((el) => el.counterparty_code === item.counterparty_code);
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
			}, [] as { counterparty_code: string; counterparty_name: string; amount_rub: number; share_pct: number }[])
			.map((item, index) => ({
				id: index,
				label: `${item.counterparty_name} (${item.share_pct.toFixed(1)}%)`,
				value: item.amount_rub / 1e9,
			}))
		: [];


	return (
		<Stack 
			spacing={2}
			sx={{
				width: '100%',
				height: '100%',
			}}
		>
			<Stack
				direction="row"
				alignItems="center"
				spacing={1}
			>
				<PercentIcon />
				<Typography variant="h5">
					Концентрация 
				</Typography>
			</Stack>
			
			{loading }
			
			{error && <Alert severity="error">{error}</Alert>}
			
			{data && data.items && data.items.length > 0 && (
				<Paper
					variant="outlined"
					sx={{
						width: '100%',
						height: '100%',
						p: 3,
						// bgcolor: "surface.light",
					}}
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
						<Stack
							direction="row" 
							spacing={1}
							sx={{
								p: 1
							}}
						>
							<Typography variant="h6">
								<strong>Всего:</strong> {(data.total_amount / 1e9).toFixed(2).toLocaleString()} млрд ₽
							</Typography>
							<Typography variant="h6">
								<strong>Контрагентов:</strong> {aggregatedPieData.length}
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
								position: { vertical: 'middle', horizontal: 'right' },
							},
						}}
					/>
				</Stack>
				</Paper>
			)}
			
			{data && (!data.items || data.items.length === 0) && (
				<Alert severity="info">Нет данных за {formatISODate(reportDate)}</Alert>
			)}
		</Stack>
	);
}
