'use client'

import { useState, useEffect } from 'react';

import { getCounterparties } from '@/services/api';
import { CounterpartyInfo } from '@/types';

import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
	Typography,
	Stack,
	IconButton,
	Paper,
} from '@mui/material';

import PeopleIcon from '@mui/icons-material/People';

const counterpartyTypeLables: Record<string, string> = {
	bank: 'Банк',
	cbr: 'ЦБ РФ',
	corporate: 'Корпоративный',
	individual: 'Физическое лицо',
};

export default function CounterpartiesDataGrid() {
	const [rows, setRows] = useState<CounterpartyInfo[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	const fetchData = async () => {
		setLoading(true);
		try {
			const data = await getCounterparties();

			if (data && data.items && Array.isArray(data.items)) {
				const formattedRows = data.items.map((item) => ({
					...item,
					id: String(item.id),
				}));
				setRows(formattedRows);
			}
			console.log('Counterparties:', data);
			console.log(rows);
		
		} catch (err) {
			// todo error handle
			console.error('CounterpartiesDataGrid: ', err);
			setError(err);
		} finally {
			setLoading(false);
		}
	}; 

	const columns: GridColDef[] = [
		{ 
			field: 'id',
		   	headerName: 'ID',
		   	flex: 1,
		   	sortComparator: (v1, v2) => Number(v1) - Number(v2)
		},
		{ field: 'code', headerName: 'Код', flex: 1 },
	    { field: 'short_name', headerName: 'Краткое наименование', flex: 2 },
		{ field: 'full_name', headerName: 'Полное наименование', flex: 2 },
		{ field: 'inn', headerName: 'ИНН', flex: 1 },
		{ 
			field: 'counterparty_type',
		   	headerName: 'Тип',
		   	flex: 1,
			valueGetter: (params) => counterpartyTypeLables[params.value] || params,
	   	},
		{ field: 'country', headerName: 'Страна', flex: 1 },
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
				<PeopleIcon />
				<Typography variant="h4">
					Справочник контрагентов	
				</Typography>
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
					pageSizeOptions={[5, 10, 25]}
					disableRowSelectionOnClick
					initialState={{
						sorting: {
							sortModel: [{field: 'id', sort: 'asc'}],
						},
					}}
					sx={{
						bgcolor: 'surface'
					}}
				/>
			</Paper>
		</ Stack>
	);
}
