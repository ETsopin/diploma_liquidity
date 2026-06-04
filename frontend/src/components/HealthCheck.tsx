'use client'

import { useState, useEffect } from 'react';
import {
	Stack,
	Typography,
	IconButton,
	Box,
} from '@mui/material';

import { healthCheck } from '@/services/api';
import NavIconButton from '@/components/Layout/NavIconButton';

import LoopIcon from '@mui/icons-material/Loop';
import WifiIcon from '@mui/icons-material/Wifi';


interface HealthStatus {
	api: boolean,
	sourceDb: boolean,
	dwh: boolean,
}

export default function HealthCheck() {
	const [status, setStatus] = useState<HealthStatus | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const checkHealth = async () => {
		setLoading(true);

		try {
			const data = await healthCheck();
			
			setStatus({
				api: data.status === 'ok',
				sourceDb: data.database === 'connected',
				dwh: data.database === 'connected',
			});
		} catch (err) {
			setError('Не удалось подключиться к API');
			setStatus({ api: false, sourceDb: false, dwh: false });
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		
		checkHealth();
	}, []);

	return(
		<Stack
			direction="row"
			sx={{
				height: 32,
				alignItems: 'center',
				width: '100%',
			}}
			spacing={4}
		>
			<Stack 
				direction="row"
				sx={{
					alignItems: 'center',
				}}
				spacing={1}
			>
				<Typography variant="body">
					<b>Расчетное ядро: </b>
					{status?.api ? 'Подключено' : 'Не подключено'}
				</Typography>
				<IconButton
					color='tertiary'
					onClick={checkHealth}
				>
					<LoopIcon/>
				</IconButton>
			</Stack>
			<Stack 
				direction="row"
				sx={{
					alignItems: 'center',
				}}
				spacing={1}
			>
				<Typography variant="body">
					<b>DWH: </b>
					{status?.dwh ? 'Подключено' : 'Не подключено'}
				</Typography>
				<WifiIcon color={status?.dwh ? 'primary' : 'error'}/>
			</Stack>
			<Stack 
				direction="row"
				sx={{
					alignItems: 'center',
				}}
				spacing={1}
			>
				<Typography variant="body">
					<b>Source DB: </b>
					{status?.sourceDb ? 'Подключено' : 'Не подключено'}
				</Typography>
				<WifiIcon color={status?.sourceDb ? 'primary' : 'error'} />
			</Stack>
		</Stack>
	);
}
