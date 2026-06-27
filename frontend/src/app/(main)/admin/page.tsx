'use client'

import { useState } from 'react';

import { User } from '@/types';

import ContentStack from '@/components/Layout/ContentStack';
import CreateUserDialog from '@/components/Forms/CreateUserDialog';
import UsersList from '@/components/Lists/UsersList';
import EditUserDialog from '@/components/Forms/EditUserDialog';

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

			{activeTab === 1 && (
				<>
					<Button 
						variant="contained"
					   	onClick={() => setDialogOpen(true)}
						sx={{
							bgcolor: 'inverse.surface',
							color: 'inverse.onSurface',
							'&:hover': {
								bgcolor: 'inverse.surface',
								opacity: 0.8,
							},
						}}
					>
						Создать пользователя
					</Button>
					<CreateUserDialog
						open={dialogOpen}
						onClose={() => setDialogOpen(false)}
						onUserCreated={() => {setRefreshKey(prev => prev + 1);}}
					/>

					<UsersList 
						refreshKey={refreshKey}
						onEditUser={(user) => setEditingUser(user)}
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
