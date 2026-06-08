'use client';

import { useState } from 'react';

import ContentStack from '@/components/Layout/ContentStack';
import ETLForm from '@/components/Forms/ETLForm';
import CalculateForm from '@/components/Forms/CalculateForm';
import CoreHistory from '@/components/Lists/CoreHistory';

import { 
	Stack,
	Typography,
	Tab,
	Tabs,	
	Paper,
} from '@mui/material';

// import { DataGrid } from '@mui/x-data-grid';
// 
// function CoreHistory() {
// 	const columns = [
// 		{ field: 'id', headerName: 'ID', width: 128 },
// 		{ field: 'date', headerName: 'Дата выполенения', width: 256 },
// 		{ field: 'operation', headerName: 'Тип операции', width: 256 },
// 	];
// 
// 	const rows = [
// 		{id: 1, date: 'x3', operation: 'x3'},
// 		{id: 2, date: 'x3', operation: 'x3'},
// 		{id: 3, date: 'x3', operation: 'x3'},
// 	];
// 
// 
// 	return (
// 		<Paper 
// 			variant="outlined"
// 			sx={{
// 				margin: 2
// 			}}
// 		>
// 			<DataGrid
// 				rows={rows}
// 				columns={columns}
// 				initialState={{
// 					pagination: {
// 						paginationModel: {page: 0, pageSize: 10},
// 					},
// 				}}
// 				pageSizeOptions={[5, 10]}
// 			/>
// 		</Paper>
// 	);
// }

export default function Core() {
	const [activeTab, setActiveTab] = useState(0);

	const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
		setActiveTab(newValue);
	}

	return (
	    <ContentStack>
			<Stack 
				direction="row"
				sx={{
					justifyContent: 'space-between',
					py: 2,
				}}
			>
				<Typography variant="h2">Расчетное ядро</Typography>
			</Stack>
			<Tabs 
				value={activeTab} 
				onChange={handleTabChange}
			>
				<Tab label="ETL Pipeline"/>
				<Tab label="Расчеты"/>
			</Tabs>

			{ activeTab === 0 && (
				<ETLForm />
			)}

			{ activeTab === 1 && (
				<Stack>
					<CalculateForm />
				</Stack>
			)}
			<CoreHistory />

	    </ContentStack>
	);
}
