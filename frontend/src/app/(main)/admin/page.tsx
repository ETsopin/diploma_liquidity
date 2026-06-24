'use client'

import { useState } from 'react';

import ContentStack from '@/components/Layout/ContentStack';

import {
	Stack,
	Typography,
	Tab,
	Tabs,
} from '@mui/material';

export default function Admin() {
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
				<Typography variant="h2">Панель администрирования</Typography>
			</Stack>

			<Tabs
				value={activeTab} 
				onChange={handleTabChange}
			>
				<Tab label="Состояние системы" />
				<Tab label="Пользователи" />
			</Tabs>

			
	    </ContentStack>
	);
};
