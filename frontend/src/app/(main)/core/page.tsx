'use client';

import { useState } from 'react';

import ContentStack from '@/components/Layout/ContentStack';
import ETLForm from '@/components/Forms/ETLForm';
import CalculateForm from '@/components/Forms/CalculateForm';
import CoreHistoryDataGrid from '@/components/DataGrids/CoreHistory';

import { 
	Stack,
	Typography,
	Tab,
	Tabs,	
	Paper,
} from '@mui/material';


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
			<CoreHistoryDataGrid />

	    </ContentStack>
	);
}
