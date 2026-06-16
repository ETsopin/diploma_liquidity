'use client'

import { useState, useEffect } from 'react';

import { getETLBatches, getCalculations } from '@/services/api';
import { formatISODate, formatISODateTime } from '@/utils/dateUtils';

import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
	Paper,
	Typography, 
	Stack,
	IconButton,
} from '@mui/material';

import LoopIcon from '@mui/icons-material/Loop';
import HistoryIcon from '@mui/icons-material/History';


interface UnifiedOperation {
	id: string;
	date: string;
	operation: string;
	status: string;
	details: string;
	source: 'etl' | 'calculations';
}

export default function CoreHistoryDataGrid() {
	const [rows, setRows ] = useState<UnifiedOperation[]>([]);
	const [loading, setLoading] = useState(true);

	const [limit, setLimit] = useState(100);
	const [offset, setOffsset] = useState(0);

	const fetchData = async () => {
		setLoading(true);

		try {
			const [etlBatches, calculations] = await Promise.all([
				getETLBatches(limit, offset),
				getCalculations(limit, offset),
			]);

			const unifiedRows: UnifiedOperation[] = [];

			console.log(etlBatches);
			console.log(calculations);

			(etlBatches.items || []).forEach((batch) => {
				unifiedRows.push({
					id: `etl-${batch.batch_id}`,
					date: formatISODateTime(batch.started_at),
					report_date: formatISODate(batch.report_date),
					operation: `ETL загрузка (${batch.source})`,
					status: batch.status,
					source: 'etl',
				});
			});

			(calculations.items || []).forEach((calc) => {
				unifiedRows.push({
					id: `calc-${calc.id}`,
					date: formatISODateTime(calc.started_at),
					report_date: formatISODate(calc.report_date),
					operation: `Расчет (${calc.calc_type})`,
					status: calc.status,
					source: 'calculation',
				});
			});
			setRows(unifiedRows);
			console.log(unifiedRows);
		
		} catch (err) {
			console.error('CORE HISTORY FAILED:', err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	const columns : GridColDef[] = [
		{field: 'id', headerName: 'ID', flex: 1}, 
		{field: 'source', headerName: 'Источник', flex: 2}, 
		{field: 'date', headerName: 'Дата выполнения', flex: 4}, 
		{field: 'report_date', headerName: 'Дата отчета', flex: 4}, 
		{field: 'operation', headerName: 'Тип операции', flex: 2}, 
		{field: 'status', headerName: 'Статус', flex: 2}, 
	];

	return (
		<Stack
			direction="column"
			spacing={3}
			sx={{
				width: '100%'
			}}
		>
			<Stack
				direction="row"
				spacing={1}
				alignItems="center"
			>
				<HistoryIcon
			 		fontSize="large"	
				/>
				<Typography
					variant="h4"
				>
					Журнал операций расчетного ядра
				</Typography>
				<IconButton
					fontSize="small"
					onClick={fetchData}
				>
					<LoopIcon/>
				</IconButton>
			</Stack>
			<Paper
				variant="outlined"
				sx={{
					width: '100%',
				}}
			>
				<DataGrid 
					rows={rows}
					columns={columns}
					loading={loading}
					initialState={{
						pagination: {
							paginationModel: {page: 0, pageSize: 10},
						},
					}}
					pageSizeOptions={[5, 10, 25]}
					disableRowSelectionOnClick
				/>
			</Paper>
		</Stack>
	)
}
