'use client';

import { useState, useEffect, useCallback } from 'react';
import { DataGrid, GridColDef, ruRU } from '@mui/x-data-grid';
import { Chip, Typography, Box, Paper, Tooltip } from '@mui/material';
import { LogRecord } from '@/types/schemas';

interface LogsDataGridProps {
	refreshKey?: number;
}

export default function LogsDataGrid({ refreshKey }: LogsDataGridProps) {
	const [rows, setRows] = useState<LogRecord[]>([]);
	const [loading, setLoading] = useState(true);
	const [total, setTotal] = useState(0);
	const [paginationModel, setPaginationModel] = useState({
		page: 0,
		pageSize: 10,
	});
	
	const fetchLogs = useCallback(async () => {
		setLoading(true);
		try {
			const params = new URLSearchParams({
				limit: String(paginationModel.pageSize),
				offset: String(paginationModel.page * paginationModel.pageSize),
			});
			const res = await fetch(`/api/admin/logs?${params}`);
			if (!res.ok) throw new Error('Failed to fetch logs');
			const data = await res.json();
			setRows(data.items);
			setTotal(data.total);
		} catch (err) {
			console.error('Error fetching logs:', err);
		} finally {
			setLoading(false);
		}
	}, [paginationModel]);
	
	useEffect(() => {
		fetchLogs();
	}, [fetchLogs, refreshKey]);
	
	const statusColor = (status: string) => {
		switch (status) {
			case 'success': return 'success';
			case 'error': return 'error';
			case 'warning': return 'warning';
			default: return 'default';
		}
	};
	
	const actionLabels: Record<string, string> = {
		login: 'Вход',
		logout: 'Выход',
		user_create: 'Создание пользователя',
		user_update: 'Обновление пользователя',
		user_delete: 'Деактивация пользователя',
		generate_report: 'Генерация отчёта',
		download_report: 'Скачивание отчёта',
		run_etl: 'Загрузка ETL',
		run_calculation: 'Расчёт',
		view_dashboard: 'Просмотр дашборда',
		change_theme: 'Смена темы',
		update_settings: 'Обновление настроек',
	};
	
	const columns: GridColDef[] = [
		{
			field: 'timestamp',
			headerName: 'Дата',
			flex: 1,
			renderCell: (params) =>
				params.value 
				? new Date(params.value).toLocaleString('ru-RU')
				: '-',
		},
		{
			field: 'user_email',
			headerName: 'Пользователь',
			flex: 1,
		},
		{
			field: 'action',
			headerName: 'Действие',
			flex: 1,
			renderCell: (params) => actionLabels[params.value] || params.value,
		},
		{
			field: 'entity',
			headerName: 'Сущность',
			flex: 1,
		},
		{
			field: 'status',
			headerName: 'Статус',
			flex: 1,
			renderCell: (params) => (
				<Chip
					label={params.value}
					color={statusColor(params.value)}
					size="small"
				/>
			),
		},
		{
			field: 'details',
			headerName: 'Детали',
			flex: 4,
			renderCell: (params) => {
				if (!params || !params.value) return null;
				const text = JSON.stringify(params.value, null, 1);
				return (
					<Tooltip
						title={
							<pre
								style={{margin: 0, fontSize: 12}}
							>
								{text}
							</pre>
						}
					>
					<Typography variant="body2" noWrap sx={{ maxWidth: 1 }}>
						{text}
					</Typography>
					</Tooltip>
				);
			}
		},
	];
	
	return (
		<Paper
			variant="outlined"	
	   		sx={{width: '100%' }}>
			<DataGrid
				rows={rows}
				columns={columns}
				getRowId={(row) => row._id}
				paginationModel={paginationModel}
				onPaginationModelChange={setPaginationModel}
				pageSizeOptions={[10, 20, 50]}
				rowCount={total}
				paginationMode="server"
				loading={loading}
				autoHeight
				localeText={ruRU.components.MuiDataGrid.defaultProps.localeText}
				sx={{ border: 0 }}
			/>
		</Paper>
	);
}
