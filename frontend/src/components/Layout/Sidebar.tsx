'use client'
import { ReactNode, useContext } from 'react';
import { useRouter } from 'next/navigation';

import {
	Stack,
	Container,
	Box,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

import NavIconButton, { NavIconButtonProps } from '@/components/Layout/NavIconButton';
import { ColorModeContext } from '@/styles/theme/ThemeProvider';

import HomeIcon from '@mui/icons-material/Home';
import AssigmentIcon from '@mui/icons-material/Assignment';
import LaunchIcon from '@mui/icons-material/Launch';
import EventIcon from '@mui/icons-material/Event';
import BarChartIcon from '@mui/icons-material/BarChart';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ListAltIcon from '@mui/icons-material/ListAlt';
import BedtimeIcon from '@mui/icons-material/Bedtime';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import Brightness7Icon from '@mui/icons-material/Brightness7';

import { useAuth } from '@/context/AuthContext';


interface SidebarProps {
	children: ReactNode;
}

export default function Sidebar({ children }: SidebarProps) {
	return (
		<Stack
			direction="column"
			sx={{
				width: 72,
			}}
		>
				<Container 
					disableGutters
					sx={{
						display: "flex",
						flexDirection: "column",
						justifyContent: "center",
						alignItems: "center",
					}}
				>
					{children}
				</Container>
		</Stack>
	);
}

const LEFT_SIDEBAR_ITEMS: Omit<NavIconButtonProps, 'key'>[] = [
	{icon: HomeIcon, label: "Главная", href: "/"},
	{icon: AssigmentIcon, label: "Отчеты", href: "/reports"},
	{icon: LaunchIcon, label: "Расчетное ядро", href: "/core"},
	{icon: BarChartIcon, label: "Дэшборды", href: "/dashboards"},
	{icon: AdminPanelSettingsIcon, label: "Админ-панель", href: "/admin"},
];

export function LeftSidebar() {
	const { user } = useAuth();

	const visibleItems = LEFT_SIDEBAR_ITEMS.filter((item) => {
		if (item.href === '/core' && user?.role === 'viewer') return false;
		if (item.href === '/admin' && user?.role !== 'admin') return false;
		return true;
	});

	return (
		<Sidebar>
			{visibleItems.map((item, index) => (
				<Box
					key={index}
					sx={{
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						width: 72,
						height: 72,
					}}
				>
					<NavIconButton
						key={index}
						{...item}
						tooltipPlacement="right"
					/>
				</Box>
			))}
		</Sidebar>
	);
}

export function RightSidebar(){
	const { refreshUser } = useAuth();
	const { toggleColorMode, mode } = useContext(ColorModeContext);
	const router = useRouter();
	const theme = useTheme();

	const handleLogout = async () => {

		const response = await fetch('/api/auth/logout', {
			method: 'POST',
			credentials: 'include',
		});

		if (response.ok) {
			refreshUser();
			router.push('/auth');
		}
	};

	const getRightSidebarItems = (): Omit<NavIconButtonProps, 'key'>[] => [
		{
			icon: mode === 'dark' ? Brightness7Icon : BedtimeIcon,
			label: mode === 'dark' ? 'Светлая тема' : 'Темная тема',
			onClick: toggleColorMode,
		},
		{ icon: LogoutIcon, label: "Выход из аккаунта", onClick: () => { handleLogout() }},
    ];

	const rightSidebarItems = getRightSidebarItems();

	return (
		<Sidebar>
			{rightSidebarItems.map((item, index) => (
				<Box
					key={index}
					sx={{
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						width: 72,
						height: 72,
					}}
				>
					<NavIconButton
						key={index}
						{...item}
						tooltipPlacement="left"
					/>
				</Box>
			))}
		</Sidebar>
	);
}
