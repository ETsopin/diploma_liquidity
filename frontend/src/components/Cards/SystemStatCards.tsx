'use client';

import { useState, useEffect } from 'react';

import {
	Paper,
	Stack,
	Typography,
	CircularProgress,
} from '@mui/material';

import PeopleIcon from '@mui/icons-material/People';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ArticleIcon from '@mui/icons-material/Article';
import BarChartIcon from '@mui/icons-material/BarChart';
import StorageIcon from '@mui/icons-material/Storage';

import { SummaryStats } from '@/services/stats';

const CARDS = [
	{ key: 'total_users', label: 'Пользователи:', icon: PeopleIcon },
	{ key: 'total_logs', label: 'Операции:', icon: ListAltIcon, },
	{ key: 'total_reports', label: 'Отчеты:', icon: ArticleIcon,  },
	{ key: 'total_calculations', label: 'Расчеты:', icon: BarChartIcon,  },
	{ key: 'total_etls', label: 'Загрузки ETL:', icon: StorageIcon,  },
] as const;

export default function SystemStatCards() {
	const [stats, setStats] = useState<SummaryStats | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		(async () => {
			try {
				const res = await fetch('/api/admin/stats/summary');
				if (res.ok) {
					setStats(await res.json());
				}
			} catch (err) {
				console.error('StatCards fetch error:', err);
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	if (loading) {
		return <CircularProgress />;
	}

	return (
		<Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
			{CARDS.map(({ key, label, icon: Icon, color }) => (
				<Paper
					key={key}
					variant="outlined"
					sx={{
						flex: '1 1 160px',
						minWidth: 140,
						p: 2,
						display: 'flex',
						alignItems: 'center',
						gap: 2,
					}}
				>
					<Icon fontSize="large"/>
					<Stack>
						<Typography variant="body2" color="text.secondary">
							{label}
						</Typography>
						<Typography variant="h5">
							{stats ? stats[key] : '—'}
						</Typography>
					</Stack>
				</Paper>
			))}
		</Stack>
	);
}
