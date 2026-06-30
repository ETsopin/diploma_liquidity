'use client';

import { ReactNode } from 'react';

import { DashboardWidget } from '@/types/dashboards';

import {
	Paper,
	Stack,
	Typography,
	IconButton,
	Tooltip,
} from '@mui/material';

import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import SettingsIcon from '@mui/icons-material/Settings';
import CloseIcon from '@mui/icons-material/Close';


interface WidgetWrapperProps {
	widget: DashboardWidget;
	mode: 'view' | 'edit';
	children: ReactNode;
	onRemove?: (id: string) => void;
	onConfig?: (id: string) => void;
}

export default function WidgetWrapper({
	widget,
	mode,
	children,
	onRemove,
	onConfig,
}: WidgetWrapperProps) {
	return (
		<Paper
			variant="outlined"
			sx={{
				width: '100%',
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
overflow: 'auto',
				bgcolor: 'background.paper',
			}}
		>
			{mode === 'edit' && (
				<Stack
					direction="row"
					alignItems="center"
					justifyContent="space-between"
					sx={{
						px: 1,
						py: 0.5,
						borderBottom: 1,
						borderColor: 'divider',
						bgcolor: 'action.hover',
						cursor: 'grab',
					}}
					className="drag-handle"
				>
					<Stack direction="row" alignItems="center" spacing={0.5}>
						<DragIndicatorIcon fontSize="small" color="disabled" />
						<Typography variant="subtitle2" noWrap sx={{ maxWidth: 200 }}>
							{widget.title}
						</Typography>
					</Stack>
					<Stack direction="row">
						{onRemove && (
							<Tooltip title="Удалить">
								<IconButton
									size="small"
									onClick={() => onRemove(widget.id)}
								>
									<CloseIcon fontSize="small" />
								</IconButton>
							</Tooltip>
						)}
					</Stack>
				</Stack>
			)}

			<Stack sx={{ flex: 1, overflow: 'hidden', p: 1 }}>
				{children}
			</Stack>
		</Paper>
	);
}
