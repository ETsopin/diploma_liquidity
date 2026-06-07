'use client'

import { useState, FormEvent, ChangeEvent } from 'react';

import { LaunchETLRequest, SourceETL } from '@/types/etl';
import { formatDate, parseToISODate } from '@/utils/dateUtils';

import {
	Stack,
	Typography,
	Button,
	FormGroup,
	FormControlLabel,
	Checkbox,
	TextField,
	MenuItem,
	ToggleButton,
	ToggleButtonGroup,
	Alert,
} from '@mui/material';


const initialState: LaunchETLRequest = {
	source: 'all',
	report_date: formatDate(new Date()),
};

const ETL_SOURCE_OPTIONS = [
	{ value: 'all' as const, label: 'Все (PostgreSQL + Excel)' },
	{ value: 'postgres' as const, label: 'CSV (.csv)' },
	{ value: 'excel' as const, label: 'PDF (.pdf)' },
];

export default function ReportForm() {
	const [formData, setFormData] = useState<LaunchETLRequest>(initialState);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);


	const handleSourceChange = (
		event: React.MouseEvent<HTMLElement>,
		newSource: SourceETL | null,
	) => {
		if (newSource != null) {
			setFormData({
				...formData,
				source: newSource,
			});
		}
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();

		setLoading(true);
		setError(null);
		setSuccess(false);

		try {
			const payload = {
				report_date: parseToISODate(formData.report_date),
				source: formData.source,
			}

			console.log('PAYLOAD: ', payload);

			const response = await fetch('/api/etl/run', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-API-Key': 'change_me_in_production',
				},
				body: JSON.stringify(payload),
			});

			console.log(response);	
			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || data.detail || 'Ошибка при генерции отчета');
			}

			setSuccess(true);
			console.log('API Response:', data);

			setTimeout(() => setSuccess(false), 5000);
		
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Произошла ошибка');
			console.log('Ошибка:', err);
		}

		finally {
			setLoading(false);
		}
	};


	const setYearStart = () => {
		const date = new Date();
		date.setMonth(0,1);

		setFormData({
			...formData,
			report_date: formatDate(date),
		});
	};

	const setQuarterStart = () => {
		const date = new Date();
		const quarter = Math.floor(date.getMonth() / 3);
		date.setMonth(quarter * 3, 1);

		setFormData({
			...formData,
			report_date: formatDate(date),
		});
	};

	const setMonthStart = () => { 
		const date = new Date();
		date.setDate(1);
		setFormData({
			...formData,
			report_date: formatDate(date),
		});
	};


	return (
		<Stack
			component="form"
			onSubmit={handleSubmit}
			direction="column"
			spacing={4}
			sx={{
				py: 2,
				width: '100%',
			}}
		>
			<Typography variant="h4">
				Запуск ETL-процесса
			</Typography>

			<Stack direction="column" spacing={1}>
				<TextField
					label="Дата отчета"
					value={formData.report_date}
					onChange={
						(e) => setFormData({
							...formData,
							report_date: e.target.value
						})
					}
				/>
				<Stack direction="row" spacing={1}>
					<Button 
						variant="outlined"
						size="small"
						onClick={setYearStart}
					>
						Начало года
					</Button>
					<Button 
						variant="outlined"
						size="small"
						onClick={setQuarterStart}
					>
						Начало квартала
					</Button>
					<Button 
						variant="outlined"
						size="small"
						onClick={setMonthStart}
					>
						Начало месяца
					</Button>
				</Stack>
			</Stack>

			<Stack direction="column" spacing={1}>
				<Typography
					variant="h6"
				>
					Источники данных:
				</Typography>
				<ToggleButtonGroup
					value={formData.source}
					exclusive
					onChange={handleSourceChange}
				>
					<ToggleButton value="all">
						Все (PostgreSQL + Excel)
					</ToggleButton>	
					<ToggleButton value="postgres">
						PostgreSQL
					</ToggleButton>	
					<ToggleButton value="excel">
						Excel
					</ToggleButton>	
				</ToggleButtonGroup>
			</Stack>

			<Button 
				type="submit"
				variant="contained"
				sx={{
					bgcolor: 'inverse.surface',
					color: 'inverse.onSurface',	
				}}
				onClick={() => {console.log(formData);}}
			>
				Запустить ETL
			</Button>

			{error && (
				<Alert 
					severity="error"
					sx={{
						bgcolor: 'error.errorContainer',
						color: 'error.onErrorContainer',
					}}
				>
					{error}
				</Alert>
			)}

			{success && (
				<Alert 
					severity="success"
					sx={{
						bgcolor: 'primary.light',
					}}
				>
					Отчет успешно сгенерирован!
				</Alert>
			)}
		</Stack>
	);
}
