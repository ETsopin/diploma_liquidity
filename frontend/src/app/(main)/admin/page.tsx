'use client'

import { useState } from 'react';

import { User } from '@/types';

import ContentStack from '@/components/Layout/ContentStack';
import CreateUserDialog from '@/components/Forms/CreateUserDialog';
import UsersList from '@/components/Lists/UsersList';
import EditUserDialog from '@/components/Forms/EditUserDialog';
import LogsDataGrid from '@/components/DataGrids/LogsDataGrid';

import {
	Stack,
	Typography,
	Tab,
	Tabs,
	Button,
} from '@mui/material';

import HistoryEduIcon from '@mui/icons-material/HistoryEdu';

export default function Admin() {
	const [activeTab, setActiveTab] = useState(0);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [refreshKey, setRefreshKey] = useState(0);
	const [editingUser, setEditingUser] = useState<User | null>(null);

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

			{activeTab === 0 && (
				<Stack
					direction="column"
					spacing={2}
					sx={{
						width: '100%',
					}}
				>
					<Stack
						direction="row"
						spacing={1}
						alignItems="center"
					>
						<HistoryEduIcon fontSize="large" />
						<Typography
							variant="h4"
						>
							Журнал действий
						</Typography>
					</Stack>
					<LogsDataGrid refreshKey={refreshKey} />
				</Stack>
			)}

			{activeTab === 1 && (
				<>
					<CreateUserDialog
						open={dialogOpen}
						onClose={() => setDialogOpen(false)}
						onUserCreated={() => {setRefreshKey(prev => prev + 1);}}
					/>

					<UsersList 
						refreshKey={refreshKey}
						onEditUser={(user) => setEditingUser(user)}
						onCreateUser={() => setDialogOpen(true)}
					/>
					<EditUserDialog
						open={!!editingUser}
						user={editingUser}
						onClose={() => setEditingUser(null)}
						onUserUpdated={() => setRefreshKey(prev => prev + 1)}
					/>
				</>
			)}
	    </ContentStack>
	);
};
