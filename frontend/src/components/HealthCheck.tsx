'use client'

import { useState, useEffect } from 'react';
import {
	Box,
} from '@mui/material';


interface HealthStatus {
	api: boolean,
	sourceDb: boolean,
	dwh: boolean,
}

export default function HealthCheck() {
	const [status, setStatus] = useState<HealthStatus | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const checkHealth = async () => {
			setLoading(true);

			try {
				const response = await fetch('/api/health');
				const data = await response.json();

				console.log(JSON.stringify(data));
				
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
		
		checkHealth();
	}, []);

	return(
		<>
			{JSON.stringify(status)}
		</>
	);
}
