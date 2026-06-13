'use client'

import { useState, useEffect } from 'react';

import { getTimebuckets } from '@/services/api';
import { TimebucketInfo } from '@/types/schemas';

import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
	Typography,
	Stack,
	IconButton,
	Paper,
} from '@mui/material';

import SchemaIcon from '@mui/icons-material/Schema';
import LoopIcon from '@mui/icons-material/Loop';

export default function TimebucketsDataGrid() {
	const [rows, setRows] = useState<TimebucketInfo[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	const fetchData = async () => {
		setLoading(true);
		try {
			const data = await getTimebuckets();

			if (data && Array.isArray(data)) {
				const formattedRows = data.map((item) => ({
					...item,
					id: String(item.id),
				}));
				setRows(formattedRows);
			}
			console.log('Timebuckets:', data);
		
		} catch (err) {
			// todo error handle
			console.error('TimebucketsDataGrid: ', err);
			setError(err);
		} finally {
			setLoading(false);
		}
	}; 

	const columns: GridColDef[] = [
		{ field: 'id', headerName: 'ID', flex: 1 },
		{ field: 'code', headerName: 'Код', flex: 2 },
		{ field: 'name', headerName: 'Наименование', flex: 4 },
		{ field: 'min_days', headerName: 'Мин. дней', flex: 2 },
		{ field: 'sort_order', headerName: 'Порядок', flex: 2},
	];

	useEffect(() => {
		fetchData();
	}, []);

	return (
		<Stack   
			direction="column"
			sx={{
				width: '100%'
			}}
			spacing={2}
		>
			<Stack 
				direction="row"
				spacing={1}
				alignItems="center"
			>
				<SchemaIcon />
				<Typography variant="h4">
					Временные корзины (ЦБ РФ)
				</Typography>
				<IconButton 
					variant="small"
					onClick={fetchData}
					color="tertiary"
				>
					<LoopIcon />
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
						sorting: {
							sortModel: [{ field: 'sort_order', sort: 'asc' }],
						},
					}}
					pageSizeOptions={[5, 10, 25]}
					disableRowSelectionOnClick
					sx={{
						bgcolor: 'surface'
					}}
				/>
			</Paper>
		</ Stack>
	);
}
