'use client';

import { useState } from 'react';

import ContentStack from '@/components/Layout/ContentStack';
import HealthCheck from '@/components/HealthCheck';
import TimebucketsDataGrid from '@/components/DataGrids/Timebuckets';
import CounterpartiesDataGrid from '@/components/DataGrids/Counterparties';
import ConcentrationPie from '@/components/Charts/ConcentrationPie';
import GapBarChart from '@/components/Charts/GapBarChart';
import ETLBatchDetails from '@/components/Details/ETLBatchDetails';
import CalculationDetails from '@/components/Details/CalculationDetails';
import ReportDetails from '@/components/Details/ReportDetails';
import ReportsList from '@/components/Lists/ReportsList';

import { useAuth } from '@/context/AuthContext';

import ArticleIcon from '@mui/icons-material/Article';

import {
	Stack,
	Typography,
} from '@mui/material';

export default function Home() {
	const { user } = useAuth();

	const fullName = [user?.last_name, user?.first_name, user?.middle_name]
		.filter(Boolean).join(' ');

	const roleLabels: Record<string, string> = {
		admin: 'Администратор',
		analyst: 'Аналитик',
		viewer: 'Наблюдатель',
	};

	return(
			<ContentStack>
				<Stack 
					direction="row"
					sx={{
						justifyContent: 'space-between',
					}}
				>
					<Typography variant="h2">{`Добро пожаловать, ${fullName || 'Пользователь'}!`}</Typography>
					<Typography variant="h5" color='text.secondary'>{user ? roleLabels[user.role] || user.role : '' }</Typography>
				</Stack>
				<HealthCheck />
				<Stack
					direction="row"
					spacing={2}
					sx={{
						width: '100%',
					}}
				>
					<ConcentrationPie />
					<GapBarChart />
				</Stack>
				<Stack
					direction="row"
					spacing={2}
					sx={{
						width: '100%',
					}}
				>
					<ETLBatchDetails />
					<CalculationDetails />
					<ReportDetails />
				</Stack>
				<Stack
					direction="column"
					spacing={2}
					sx={{
						width: '100%',
					}}
				>
					<TimebucketsDataGrid />
					<CounterpartiesDataGrid />
				</Stack>
				<Stack
					direction="column"
					spacing={2}
					sx={{
						width: '100%',
					}}
				>
					<Stack
						direction="row"
						spacing={1}
					>
						<ArticleIcon />
						<Typography
							variant="h5"
						>
							Отчеты
						</Typography>
					</Stack>
					<ReportsList />
				</Stack>
			</ContentStack>
	);
}
