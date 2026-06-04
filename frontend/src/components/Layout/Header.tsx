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

import { useRouter } from 'next/navigation';

import Logo from '@/components/Logo';
import NavIconButton from '@/components/Layout/NavIconButton'; 

import NotificationsIcon from '@mui/icons-material/Notifications';

export default function Header() {
	const router = useRouter();

	function LeftControls() {
		return (
			<Stack direction="row">
				<Container 
					disableGutters
					sx={{
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						width: 72
					}}
				>
					<Tooltip title='Liquidity Analytics' placement='right'>
						<IconButton onClick={()=> {router.push('/')}}>
							<Logo sx={{fontSize: 36, color: 'text.primary'}}/>
						</IconButton>
					</Tooltip>
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
					<NavIconButton
						icon={NotificationsIcon}
						label="Уведомления"
						tooltipPlacement="bottom"
						onClick={() => {console.log("notification")}}
						badgeCount={100}
					/>
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
					<IconButton onClick={()=> {router.push('/account')}}>
						<Avatar></Avatar>	
					</IconButton>
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
