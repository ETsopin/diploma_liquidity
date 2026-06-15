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
} from '@mui/material';

import { PieChart } from '@mui/x-charts/PieChart';

import PercentIcon from '@mui/icons-material/Percent';

import { getConcentration } from '@/services/api';
import { ConcentrationResponse } from '@/types';

export default function ConcentrationPie() {
	const [data, setData] = useState<ConcentrationResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [reportDate, setReportDate] = useState('2026-06-14');
	
	const fetchData = async () => {
		setLoading(true);
		try {
			const response = await getConcentration(reportDate, 'liability');
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
	
	useEffect(() => {
		fetchData();
	}, [reportDate]);
	
	const pieData = data?.items.map((item, index) => ({
		id: index,
		label: `${item.counterparty_name} (${item.share_pct.toFixed(1)}%) `,
		value: item.amount_rub / 1000,
	})) || [];

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
			
			{loading && <CircularProgress />}
			
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
						spacing={1}
						sx={{
							p: 1
						}}
					>
						<Typography variant="h6">
							<strong>Всего:</strong> {(data.total_amount / 1000).toLocaleString()} ₽
						</Typography>
						<Typography variant="h6">
							<strong>Контрагентов:</strong> {data.items.length}
						</Typography>
					</Stack>
					<Divider />
					<PieChart
						series={[
							{
								data: pieData,
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
				<Alert severity="info">Нет данных за {reportDate}</Alert>
			)}
		</Stack>
	);
}
