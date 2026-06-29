'use client';

import { useState } from 'react';
import {
	Stack,
	ToggleButtonGroup,
	ToggleButton,
	Button,
	Menu,
	MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { WIDGET_REGISTRY } from './widgets/registry';

interface DashboardToolbarProps {
	mode: 'view' | 'edit';
	onModeChange: (mode: 'view' | 'edit') => void;
	canEdit: boolean;
	onAddWidget: (type: string) => void;
}

export default function DashboardToolbar({
	mode,
	onModeChange,
	canEdit,
	onAddWidget,
}: DashboardToolbarProps) {
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

	const handleModeChange = (_: any, val: 'view' | 'edit') => {
		if (val) onModeChange(val);
	};

	return (
		<Stack direction="row" spacing={1} alignItems="center">
			<ToggleButtonGroup
				value={mode}
				exclusive
				onChange={handleModeChange}
				size="small"
			>
				<ToggleButton value="view">
					<VisibilityIcon fontSize="small" sx={{ mr: 0.5 }} />
					Просмотр
				</ToggleButton>
				<ToggleButton value="edit" disabled={!canEdit}>
					<EditIcon fontSize="small" sx={{ mr: 0.5 }} />
					Редактирование
				</ToggleButton>
			</ToggleButtonGroup>

			{mode === 'edit' && (
				<Button
					variant="outlined"
					size="small"
					startIcon={<AddIcon />}
					onClick={(e) => setAnchorEl(e.currentTarget)}
				>
					Добавить виджет
				</Button>
			)}

			<Menu
				anchorEl={anchorEl}
				open={Boolean(anchorEl)}
				onClose={() => setAnchorEl(null)}
			>
				{Object.entries(WIDGET_REGISTRY).map(([type, def]) => (
					<MenuItem
						key={type}
						onClick={() => {
							onAddWidget(type);
							setAnchorEl(null);
						}}
					>
						{def.label}
					</MenuItem>
				))}
			</Menu>
		</Stack>
	);
}
