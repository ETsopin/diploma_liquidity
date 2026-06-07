'use client';

import { useState } from 'react';

import ContentStack from '@/components/Layout/ContentStack';
import LaunchETL from '@/components/Forms/LaunchETL';

import { 
	Stack,
	Typography,
	Tab,
	Tabs,	
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
				<LaunchETL />
			)}

			{ activeTab === 1 && (
				<Stack>
					Calc
				</Stack>
			)}

	    </ContentStack>
	);
}
