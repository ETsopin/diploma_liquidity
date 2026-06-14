'use client';

import { useState } from 'react';

import ContentStack from '@/components/Layout/ContentStack';
import HealthCheck from '@/components/HealthCheck';
import TimebucketsDataGrid from '@/components/DataGrids/Timebuckets';
import CounterpartiesDataGrid from '@/components/DataGrids/Counterparties';
import ConcentrationPie from '@/components/Charts/ConcentrationPie';

import {
	Stack,
	Typography,
} from '@mui/material';

export default function Home() {
	const [userName, setUserName] = useState<string | null>(null);
	const [userRole, setUserRole] = useState<string | null>('Администратор');


	return(
			<ContentStack>
				<Stack 
					direction="row"
					sx={{
						justifyContent: 'space-between',
						py: 2,
					}}
				>
					<Typography variant="h2">{`Добро пожаловать, ${userName}!`}</Typography>
					<Typography variant="h5" color='text.secondary'>{`${userRole}`}</Typography>
				</Stack>
				<HealthCheck />
				<TimebucketsDataGrid />
				<CounterpartiesDataGrid />
				<ConcentrationPie />
			</ContentStack>
	);
}
