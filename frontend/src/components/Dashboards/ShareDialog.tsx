'use client';

import { useState, useEffect } from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	Checkbox,
	CircularProgress,
	Alert,
} from '@mui/material';

interface ShareDialogProps {
	open: boolean;
	onClose: () => void;
	onSave: (sharedWith: string[]) => void;
	initialSharedWith?: string[];
}

export default function ShareDialog({
	open,
	onClose,
	onSave,
	initialSharedWith = [],
}: ShareDialogProps) {
	const [users, setUsers] = useState<{ _id: string; email: string; role: string }[]>([]);
	const [selected, setSelected] = useState<string[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!open) return;
		(async () => {
			setLoading(true);
			setError(null);
			try {
				const res = await fetch('/api/dashboards/users');
				if (!res.ok) throw new Error('Ошибка загрузки');
				const data = await res.json();
				setUsers(data);
			} catch {
				setError('Не удалось загрузить список пользователей');
			} finally {
				setLoading(false);
			}
		})();
	}, [open]);

	useEffect(() => {
		if (open) setSelected([...initialSharedWith]);
	}, [open, initialSharedWith]);

	const toggle = (id: string) => {
		setSelected((prev) =>
			prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
		);
	};

	return (
		<Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
			<DialogTitle>Поделиться дашбордом</DialogTitle>
			<DialogContent>
				{loading && <CircularProgress />}
				{error && <Alert severity="error">{error}</Alert>}
				{!loading && !error && (
					<List dense>
						{users
							.filter((u) => u.role !== 'admin' && u.role !== 'viewer')
							.map((u) => (
								<ListItem key={u._id} disablePadding>
									<ListItemIcon>
										<Checkbox
											checked={selected.includes(u._id)}
											onChange={() => toggle(u._id)}
										/>
									</ListItemIcon>
									<ListItemText
										primary={u.email}
										secondary={u.role}
									/>
								</ListItem>
							))}
					</List>
				)}
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Отмена</Button>
				<Button variant="contained" onClick={() => onSave(selected)}>
					Сохранить
				</Button>
			</DialogActions>
		</Dialog>
	);
}
