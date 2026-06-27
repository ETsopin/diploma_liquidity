'use client'

import { useState } from 'react';

import ContentStack from '@/components/Layout/ContentStack';
import CreateUserDialog from '@/components/Forms/CreateUserDialog';
import UsersList from '@/components/Lists/UsersList';

import {
	Stack,
	Typography,
	Tab,
	Tabs,
	Button,
} from '@mui/material';

export default function Admin() {
	const [activeTab, setActiveTab] = useState(0);
	const [dialogOpen, setDialogOpen] = useState(false);

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

			{activeTab === 1 && (
				<>
					<Button variant="contained" onClick={() => setDialogOpen(true)}>
						Создать пользователя
					</Button>
					<CreateUserDialog
						open={dialogOpen}
						onClose={() => setDialogOpen(false)}
						onUserCreated={() => {}}
					/>

					<UsersList />
				</>
			)}
	    </ContentStack>
	);
};
