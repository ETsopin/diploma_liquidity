'use client';

import { useRef } from 'react';
import {
	Stack,
	Select,
	MenuItem,
	FormControl,
	InputLabel,
	IconButton,
	Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { Dashboard } from '@/types/dashboards';

interface DashboardSelectorProps {
	dashboards: Dashboard[];
	activeId: string | null;
	onChange: (id: string) => void;
	onCreate: () => void;
	onExport: () => void;
	onImport: (file: File) => void;
	onDelete: () => void;
	canDelete?: boolean;
}

export default function DashboardSelector({
	dashboards,
	activeId,
	onChange,
	onCreate,
	onExport,
	onImport,
	onDelete,
	canDelete,
}: DashboardSelectorProps) {
	const inputRef = useRef<HTMLInputElement>(null);

	const handleImport = () => {
		const file = inputRef.current?.files?.[0];
		if (file) onImport(file);
	};

	return (
		<Stack direction="row" spacing={1} alignItems="center">
			<FormControl size="small" sx={{ minWidth: 280 }}>
				<InputLabel>Дашборд</InputLabel>
				<Select
					value={activeId || ''}
					label="Дашборд"
					onChange={(e) => onChange(e.target.value)}
				>
					{dashboards.map((d) => (
						<MenuItem key={d._id} value={d._id}>
							{d.title}
						</MenuItem>
					))}
				</Select>
			</FormControl>

			<Tooltip title="Создать дашборд">
				<IconButton onClick={onCreate}>
					<AddIcon />
				</IconButton>
			</Tooltip>

			{canDelete && activeId && (
				<Tooltip title="Удалить дашборд">
					<IconButton color="error" onClick={onDelete}>
						<DeleteIcon />
					</IconButton>
				</Tooltip>
			)}

			<input
				ref={inputRef}
				type="file"
				accept=".json"
				hidden
				onChange={handleImport}
			/>
		</Stack>
	);
}
