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

import { BarChart } from '@mui/x-charts/BarChart';

import TimelineIcon from '@mui/icons-material/Timeline';

import { getGapAnalysis } from '@/services/api';
import { GapAnalysisResponse } from '@/types';

export default function GapBarChart() {
	const [data, setData] = useState<GapAnalysisResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [reportDate, setReportDate] = useState('2026-06-14');
	
	const fetchData = async () => {
		setLoading(true);
		setError(null);
		
		try {
			const response = await getGapAnalysis(reportDate);
			setData(response);
			console.log('GAP Analysis response:', response);
		} catch (err) {
			setError('Ошибка загрузки данных ГЭП-анализа');
			console.error('GAP Analysis fetch failed:', err);
		} finally {
			setLoading(false);
		}
	};
	
	useEffect(() => {
		fetchData();
	}, [reportDate]);
	
	const bucketNames = (data && data.buckets) ? data.buckets.map((b) => b.bucket_name) : [];
	const assets = (data && data.buckets) ? data.buckets.map((b) => b.total_assets_rub / 1e9) : [];  // млрд ₽
	const liabilities = (data && data.buckets) ? data.buckets.map((b) => b.total_liabilities_rub / 1e9) : [];  // млрд ₽
	
	const totalAssets = (data?.total_assets || 0) / 1e9;
	const totalLiabilities = (data?.total_liabilities || 0) / 1e9;
	const netGap = (data?.net_gap || 0) / 1e9;
	
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
				spacing={1} 
				alignItems="center"
				sx={{
					width: '100%',
				}}
			>
				<TimelineIcon />
				<Typography variant="h5">
					ГЭП-анализ
				</Typography>
			</Stack>
	
		  {loading && <CircularProgress />}
	
		  {error && <Alert severity="error">{error}</Alert>}
	
		  {data && data.buckets && data.buckets.length > 0 && (
			<Paper
				variant="outlined"
				sx={{
					p: 3,
					width: '100%',
					height: '100%',
					// bgcolor: 'surface.light'
				}}
			>
				<Stack direction="column" spacing={3}>
					<Stack
				   		direction="row" 
						spacing={2}
						sx={{
							p: 1
						}}
						alignItems="center"
					>
						<Typography variant="body1">
							<strong>Активы:</strong> {totalAssets.toFixed(2)} млрд ₽
						</Typography>
						<Typography variant="body1">
							<strong>Обязательства:</strong> {totalLiabilities.toFixed(2)} млрд ₽
						</Typography>
						<Typography variant="body1" color={netGap >= 0 ? 'success.main' : 'error.main'}>
							<strong>Нет-ГЭП:</strong> {netGap.toFixed(2)} млрд ₽
						</Typography>
					</Stack>
					<Divider />
					<BarChart
						xAxis={[
							{
								data: bucketNames,
								scaleType: 'band',
								label: 'Временные корзины',
							},
						]}
						series={[
							{
								data: assets,
								label: 'Активы, млрд ₽',
								color: '#4C662B',
							},
							{
								data: liabilities,
								label: 'Обязательства, млрд ₽',
								color: '#D32F2F',
							},
						]}
						height={400}
					/>
				</Stack>
			</Paper>
		  )}
	
		  {data && (!data.buckets || data.buckets.length === 0) && (
			<Alert severity="info">Нет данных ГЭП-анализа за {reportDate}</Alert>
		  )}
		</Stack>
	);
}
