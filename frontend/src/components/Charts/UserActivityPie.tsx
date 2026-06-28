'use client';

import { useState, useEffect } from 'react';

import {
	Paper,
	Stack,
	Typography,
	CircularProgress,
	Alert,
	Divider,
	Tabs,
	Tab,
} from '@mui/material';

import { PieChart } from '@mui/x-charts/PieChart';

import GroupIcon from '@mui/icons-material/Group';

const TABS = [
	{ label: 'ETL', entity: 'etl' },
	{ label: 'Отчёты', entity: 'report' },
	{ label: 'Расчёты', entity: 'calculation' },
];

export default function UserActivityPie() {
	const [data, setData] = useState<{ user_email: string; count: number }[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [tabIndex, setTabIndex] = useState(0);

	const entity = TABS[tabIndex].entity;

	const fetchData = async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await fetch(`/api/admin/stats/user-activity?entity=${entity}`);
			if (!res.ok) throw new Error('Ошибка загрузки');
			const json = await res.json();
			setData(json.items || []);
		} catch (err) {
			setError('Ошибка загрузки данных');
			console.error('UserActivityPie fetch error:', err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, [entity]);

	const pieData = data.map((item, index) => ({
		id: index,
		label: `${item.user_email} (${item.count})`,
		value: item.count,
	}));

	const total = data.reduce((sum, item) => sum + item.count, 0);

	return (
		<Stack spacing={2} sx={{ width: '100%', height: '100%' }}>
			<Stack direction="row" alignItems="center" spacing={1}>
				<GroupIcon />
				<Typography variant="h5">Активность пользователей</Typography>
			</Stack>

			{loading && (
				<Stack
					sx={{
						width: '100%',
						height: '100%',
					}}
					alignItems='center'
					justifyContent='center'
				>
					<CircularProgress />
				</Stack>
			)}
			{error && <Alert severity="error">{error}</Alert>}

			{!loading && !error && data.length === 0 && (
				<Alert severity="info">Нет данных</Alert>
			)}

			{!loading && !error && data.length > 0 && (
				<Paper variant="outlined" sx={{ width: '100%', height: '100%', p: 3 }}>
					<Stack spacing={2}>
						<Stack
							direction="row"
							alignItems="center"
							justifyContent="space-between"
						>
							<Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)}>
								{TABS.map((tab) => (
									<Tab key={tab.entity} label={tab.label} />
								))}
							</Tabs>
							<Typography variant="h6">
								<strong>Всего:</strong> {total}
							</Typography>
						</Stack>
						<Divider />
						<PieChart
							series={[
								{
									data: pieData,
									outerRadius: 120,
									paddingAngle: 2,
									cornerRadius: 4,
									highlightScope: { fade: 'global', highlight: 'item' },
								},
							]}
							height={350}
							slotProps={{
								legend: {
									direction: 'column',
									position: { vertical: 'middle', horizontal: 'right' },
								},
							}}
						/>
					</Stack>
				</Paper>
			)}
		</Stack>
	);
}
