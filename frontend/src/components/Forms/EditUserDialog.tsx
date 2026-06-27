'use client'

import { useState, FormEvent, useEffect } from 'react';

import { User } from '@/types';

import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Stack,
	TextField,
	MenuItem,
	Button,
	Alert,
	FormControlLabel,
	Switch,
} from '@mui/material';

import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';


const ROLE_OPTIONS = [
	{value: 'admin', label: 'Администратор'},
	{value: 'analyst', label: 'Аналитик'},
	{value: 'viewer', label: 'Наблюдатель'},
];

interface EditUserDialogProps {
	open: boolean;
	user: User | null;
	onClose: () => void;
	onUserUpdated: () => void;
}

export default function EditUserDialog(
	{ open, user, onClose, onUserUpdated }: EditUserDialogProps
) {
const [formData, setFormData] = useState({
	email: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    role: 'viewer' as string,
    is_active: true,
    password: '',
  });
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	
	useEffect(() => {
		if (user) {
			setFormData({
				email: user.email || '',
				first_name: user.first_name || '',
				middle_name: user.middle_name || '',
				last_name: user.last_name || '',
				role: user.role,
				is_active: user.is_active,
				password: '',
			});
		}
	}, [user]);
	
	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);
		
		try {
			const body: Record<string, any> = {
				email: formData.email,
				first_name: formData.first_name,
				middle_name: formData.middle_name,
				last_name: formData.last_name,
				role: formData.role,
				is_active: formData.is_active,
			};
			if (formData.password) body.password = formData.password;
			
			const response = await fetch(`/api/admin/users/${user!._id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			});
			
			const data = await response.json();
			if (!response.ok) throw new Error(data.message || 'Ошибка при обновлении');
			
			onUserUpdated();
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Произошла ошибка');
		} finally {
			setLoading(false);
		}
	};
	
	return (
		<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
			<Stack component="form" onSubmit={handleSubmit}>
				<DialogTitle>
					<Stack direction="row" spacing={1} alignItems="center">
						<ManageAccountsIcon />
						<span>Редактирование пользователя</span>
					</Stack>
				</DialogTitle>
				<DialogContent>
					<Stack spacing={2} sx={{ mt: 1 }}>
						<TextField label="Email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} required />
						<TextField label="Фамилия" value={formData.last_name} onChange={e => setFormData(p => ({ ...p, last_name: e.target.value }))} required />
						<TextField label="Имя" value={formData.first_name} onChange={e => setFormData(p => ({ ...p, first_name: e.target.value }))} required />
						<TextField label="Отчество" value={formData.middle_name} onChange={e => setFormData(p => ({ ...p, middle_name: e.target.value }))} />
						<TextField label="Роль" select value={formData.role} onChange={e => setFormData(p => ({ ...p, role: e.target.value }))}>
						  {ROLE_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
						</TextField>
						<TextField label="Новый пароль" type="password" value={formData.password}
						  onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} />
						<FormControlLabel control={<Switch checked={formData.is_active}
						  onChange={e => setFormData(p => ({ ...p, is_active: e.target.checked }))} />} label="Активен" />
						{error && <Alert severity="error">{error}</Alert>}
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button onClick={onClose}>Отмена</Button>
					<Button type="submit" variant="contained" disabled={loading}>
					  {loading ? 'Сохранение...' : 'Сохранить'}
					</Button>
				</DialogActions>
			</Stack>
		</Dialog>
	);
}
