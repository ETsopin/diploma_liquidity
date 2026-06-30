'use client';

import { useState } from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	TextField,
	Stack,
	Card,
	CardContent,
	CardActionArea,
	Typography,
} from '@mui/material';

const TEMPLATES = [
	{ slug: 'gap_analysis', title: 'GAP-анализ', desc: 'GAP по корзинам + динамика + метрики' },
	{ slug: 'concentration', title: 'Концентрация', desc: 'Pie + таблица + тренд концентрации' },
	{ slug: 'full_report', title: 'Полный отчёт', desc: 'Все визуализации в одном дашборде' },
	{ slug: 'empty', title: 'Пустой', desc: 'Начните с чистого листа' },
] as const;

interface CreateDialogProps {
	open: boolean;
	onClose: () => void;
	onCreate: (title: string, templateSlug: string) => void;
}

export default function CreateDialog({ open, onClose, onCreate }: CreateDialogProps) {
	const [title, setTitle] = useState('');
	const [selected, setSelected] = useState<string>('gap_analysis');

	const handleCreate = () => {
		if (!title.trim()) return;
		onCreate(title.trim(), selected);
		setTitle('');
		onClose();
	};

	return (
		<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
			<DialogTitle>Создать дашборд</DialogTitle>
			<DialogContent>
				<Stack spacing={2} sx={{ mt: 1 }}>
					<TextField
						label="Название"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						fullWidth
						autoFocus
					/>

					<Typography variant="subtitle2">Шаблон</Typography>
					<Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
						{TEMPLATES.map((t) => (
							<Card
								key={t.slug}
								variant="outlined"
								sx={{
									flex: '1 1 140px',
									borderColor: selected === t.slug ? 'primary.main' : undefined,
									bgcolor: selected === t.slug ? 'action.selected' : undefined,
								}}
							>
								<CardActionArea onClick={() => setSelected(t.slug)}>
									<CardContent sx={{ p: 1.5 }}>
										<Typography variant="subtitle2">{t.title}</Typography>
										<Typography variant="caption" color="text.secondary">
											{t.desc}
										</Typography>
									</CardContent>
								</CardActionArea>
							</Card>
						))}
					</Stack>
				</Stack>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Отмена</Button>
				<Button variant="contained" onClick={handleCreate} disabled={!title.trim()}>
					Создать
				</Button>
			</DialogActions>
		</Dialog>
	);
}
