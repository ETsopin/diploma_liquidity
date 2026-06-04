'use client'
import { ReactNode, useContext } from 'react';

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
	{icon: EventIcon, label: "Планировщик", href: "/scheduler"},
	{icon: BarChartIcon, label: "Дэшборды", href: "/dashboards"},
	{icon: AdminPanelSettingsIcon, label: "Пользователи", href: "/users"},
	{icon: ListAltIcon, label: "Журнал", href: "/logs"},
];

export function LeftSidebar() {
	return (
		<Sidebar>
			{LEFT_SIDEBAR_ITEMS.map((item, index) => (
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
	const { toggleColorMode, mode } = useContext(ColorModeContext);
	const theme = useTheme();

	const getRightSidebarItems = (): Omit<NavIconButtonProps, 'key'>[] => [
		{
			icon: mode === 'dark' ? Brightness7Icon : BedtimeIcon,
			label: mode === 'dark' ? 'Светлая тема' : 'Темная тема',
			onClick: toggleColorMode,
		},
		{ icon: SettingsIcon, label: "Настройки", href: "/settings" },
		{ icon: LogoutIcon, label: "Выход из аккаунта", onClick: () => { console.log("logout"); } },
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
