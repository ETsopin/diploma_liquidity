'use client'

import {
	Stack,
	Box,
	Container,
	Typography,
	Tooltip,
	IconButton,
	Avatar,
} from '@mui/material';

import Logo from '@/components/Logo';
import ListIcon from '@mui/icons-material/List';
import NotificationsIcon from '@mui/icons-material/Notifications';

export default function Header() {
	function LeftControls() {
		return (
			<Stack direction="row">
				<Container 
					disableGutters
					sx={{
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						width: 72,
					}}
				>
					<Tooltip title="Развернуть">
						<IconButton>
							<ListIcon />
						</IconButton>
					</Tooltip> 
				</Container>
				<Container 
					disableGutters
					sx={{
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						width: 128,
					}}
				>
					<Logo sx={{fontSize: 48}}/>
					<Typography variant="h6">Liquidity Analytics</Typography>
				</Container>
			</Stack>
		);
	}

	function RightControls() {
		return (
			<Stack 
				direction="row"
			>
				<Container 
					disableGutters
					sx={{
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						width: 72,
					}}
				>
					<Tooltip title="Уведомления">
						<IconButton>
							<NotificationsIcon />
						</IconButton>
					</Tooltip> 
				</Container>
				<Container 
					disableGutters
					sx={{
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						width: 72,
					}}
				>
					<Avatar></Avatar>	
				</Container>
			</Stack>
		);

	}

	return (
		<Stack 
			direction="row"
			sx={{
				justifyContent: "space-between",
				minHeight: 72,
			}}
		>
			<LeftControls />
			<RightControls />
		</Stack>
	);
}
