'use client'

import { useState, useEffect } from 'react';
import { User } from '@/types';
import { formatISODateTime } from '@/utils/dateUtils';

import {
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	IconButton,
	Stack,
	Typography,
	Avatar,
	Chip,
	CircularProgress,
} from '@mui/material';

import EditIcon from '@mui/icons-material/Edit';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LoopIcon from '@mui/icons-material/Loop';


const ROLE_LABELS: Record<string, string> = {
	admin: 'Администратор',
	analyst: 'Аналитик',
	viewer: 'Пользователь',
};

interface UsersListProps {
	refreshKey?: number;
	onEditUser?: (user: User) => void;
}

export default function UsersList(
	{refreshKey = 0, onEditUser}: UsersListProps
) {
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [limit] = useState(10);
	const [offset, setOffset] = useState(0);
	const [total, setTotal] = useState(0);

	const fetchUsers = async () => {
		setLoading(true);
		try {
			const response = await fetch(`/api/admin/users?limit=${limit}&offset=${offset}`);
			const data = await response.json();
			if (response.ok) {
				setUsers(data.items || []);
				setTotal(data.total || 0);
			} else {
				throw new Error(data.message);
			}
		
		} catch (err) {
			console.error('UserList fetch error:', err);
			setError('Ошибка при загрузке списка пользователей');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {fetchUsers();}, [limit, offset, refreshKey]);

	const getInitials = (user: User) => (user.last_name?.[0] || '?').toUpperCase();

	const getStatusChip = (user: User) => {
		if (!user.is_active){
		   	return <Chip
		   				label='Деактивирован'
					   	color="error" 
						size="small"
					/>;
		}
		if (user.last_login) {
		   	return (
				<Typography 
					variant="body2"
					color="text.secondary"
				>
					Последний вход: {formatISODateTime(String(user.last_login))}
				</Typography>
			);
		}
		return (
				<Typography 
					variant="body2"
					color="text.secondary"
				>
					Последний вход: Неизвестно
				</Typography>
		);
	};

	return (
		<Stack
			direction="column"
			sx={{width: '100%'}}
			spacing={1}
		>
			<Stack
				direction='row'
				alignItems='center'
			>
				<IconButton
					onClick={() => setOffset(o => Math.max(0, o - limit))}
					disabled={offset === 0}
					size="small"
				>
					<ChevronLeftIcon />
				</IconButton>
				<IconButton
					onClick={() => setOffset(o => o + limit)}
					disabled={offset + limit >= total}
					size="small"
				>
					<ChevronRightIcon />
				</IconButton>
				<Typography
					variant="body2"
					color="text.secondary"
					sx={{px: 1}}
				>
					{offset + 1}-{Math.min(offset + limit, total)} из {total}
				</Typography>
				<IconButton
					onClick={fetchUsers}
					size='small'
				>
					<LoopIcon />
				</IconButton>
			</Stack>
			<List>
				{users.map((user) => (
					<ListItem
					  key={String(user._id)}
					  divider
					  secondaryAction={
						<IconButton edge="end" onClick={() => onEditUser?.(user)}>
						  <EditIcon />
						</IconButton>
					  }
					>
					  <ListItemIcon>
						<Avatar>{getInitials(user)}</Avatar>
					  </ListItemIcon>
					  <ListItemText
						primary={`${user.last_name} ${user.first_name} ${user.middle_name || ''}`}
						secondary={
						  <Stack 
						  	direction="row"
						   	spacing={1} alignItems="center">
							<Chip label={ROLE_LABELS[user.role] || user.role} size="small" variant="outlined" />
							<span>{user.email}</span>
							{getStatusChip(user)}
						  </Stack>
						}
					  />
					</ListItem>
				  ))}
			</List>
		</Stack>
	);
}
