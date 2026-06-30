'use client'

import { useState, useEffect } from 'react';

import { getETLBatches, getCalculations } from '@/services/api';
import { formatISODate, formatISODateTime } from '@/utils/dateUtils';

import { DataGrid, GridColDef, ruRU } from '@mui/x-data-grid';
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
	report_date: string;
	operation: string;
	status: string;
	source: string;
}

interface CoreHistoryProps {
	refreshKey?: number;
}

export default function CoreHistoryDataGrid({refreshKey}: CoreHistoryProps) {
	const [rows, setRows] = useState<UnifiedOperation[]>([]);
	const [loading, setLoading] = useState(true);

	const fetchData = async () => {
		setLoading(true);

		try {
			const [etlBatches, calculations] = await Promise.all([
				getETLBatches(100, 0),
				getCalculations(100, 0),
			]);

			const unifiedRows: UnifiedOperation[] = [];

			(etlBatches.items || []).forEach((batch: any) => {
				unifiedRows.push({
					id: `etl-${batch.id}`,
					date: formatISODateTime(batch.started_at),
					report_date: '—',
					operation: 'ETL загрузка',
					status: batch.status,
					source: 'ETL',
				});
			});

			(calculations.items || []).forEach((calc: any) => {
				unifiedRows.push({
					id: `calc-${calc.id}`,
					date: formatISODateTime(calc.started_at),
					report_date: formatISODate(calc.report_date),
					operation: `Расчет (${calc.calc_type})`,
					status: calc.status,
					source: 'Расчет',
				});
			});
			setRows(unifiedRows);

		} catch (err) {
			console.error('CORE HISTORY FAILED:', err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, [refreshKey]);

	const columns: GridColDef[] = [
		{ field: 'source', headerName: 'Источник', flex: 2 },
		{ field: 'date', headerName: 'Дата выполнения', flex: 4 },
		{ field: 'report_date', headerName: 'Дата отчета', flex: 3 },
		{ field: 'operation', headerName: 'Тип операции', flex: 3 },
		{ field: 'status', headerName: 'Статус', flex: 2 },
	];

	return (
		<Stack
			direction="column"
			spacing={3}
			sx={{ width: '100%' }}
		>
			<Stack
				direction="row"
				spacing={1}
				alignItems="center"
			>
				<HistoryIcon fontSize="large" />
				<Typography variant="h4">
					Журнал операций расчетного ядра
				</Typography>
				<IconButton
					fontSize="small"
					onClick={fetchData}
					color="tertiary"
				>
					<LoopIcon />
				</IconButton>
			</Stack>
			<Paper
				variant="outlined"
				sx={{ width: '100%' }}
			>
				<DataGrid
					rows={rows}
					columns={columns}
					loading={loading}
					getRowId={(row) => row.id}
					initialState={{
						pagination: {
							paginationModel: { page: 0, pageSize: 10 },
						},
						sorting: {
							sortModel: [{field: 'date', sort: 'desc'}],
						},
					}}
					pageSizeOptions={[10, 25, 50]}
					disableRowSelectionOnClick
					localeText={ruRU.components.MuiDataGrid.defaultProps.localeText}
				/>
			</Paper>
		</Stack>
	);
}
