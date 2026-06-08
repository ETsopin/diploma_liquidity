'use client'

import { useState, FormEvent, ChangeEvent } from 'react';

import { ReportGenerateRequest, ReportType, ReportFormat } from '@types/reports';

import {
	formatDate,
	parseToISODate,
} from '@/utils/dateUtils';

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

import NoteAddIcon from '@mui/icons-material/NoteAdd';

const initialState: ReportGenerateRequest = {
	report_date: formatDate(new Date()),
	report_type: 'full',
	report_format: 'pdf',
};

const REPORT_TYPE_OPTIONS = [
	{ value: 'full' as const, label: 'Полный' },
	{ value: 'gap' as const, label: 'ГЭП-Анализ' },
	{ value: 'concentration' as const, label: 'Концентрация' },
];

const FORMAT_TYPE_OPTIONS = [
	{ value: 'excel' as const, label: 'Excel (.xlsx)' },
	{ value: 'csv' as const, label: 'CSV (.csv)' },
	{ value: 'pdf' as const, label: 'PDF (.pdf)' } ,
];

export default function ReportForm() {
	const [formData, setFormData] = useState<ReportGenerateRequest>(initialState);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);


	const handleFormatChange = (
		event: React.MouseEvent<HTMLElement>,
		newFormat: ReportFormat | null,
	) => {
		if (newFormat != null) {
			setFormData({
				...formData,
				report_format: newFormat,
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
				report_type: formData.report_type,
				report_format: formData.report_format,
			}

			console.log('PAYLOAD: ', payload);

			const response = await fetch('/api/reports/generate', {
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

			setSuccess(data.message);
			console.log('API Response:', data);

			// setTimeout(() => setSuccess(false), 5000);
		
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
			<Stack 
				direction="row"
				alignItems="center"
				spacing={1}
			>
				<NoteAddIcon
			 		fontSize="large"	
				/>
				<Typography variant="h4">
					Новый отчет
				</Typography>
			</Stack>

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
				<TextField
					label="Тип отчета"
					value={formData.report_type}
					select
					onChange={
						(e) => setFormData({
							...formData,
							report_type: e.target.value as ReportType
						})
					}
					sx={{
					}}
				>
					{REPORT_TYPE_OPTIONS.map((option) => (
					  <MenuItem key={option.value} value={option.value}>
						{option.label}
					  </MenuItem>
					))}
				</TextField>

				<ToggleButtonGroup
					value={formData.report_format}
					exclusive
					onChange={handleFormatChange}
				>
					<ToggleButton value="excel">
						Excel (.xlsx)
					</ToggleButton>	
					<ToggleButton value="csv">
						CSV (.csv)
					</ToggleButton>	
					<ToggleButton value="pdf">
						PDF (.pdf)
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
				Сгенерировать
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
					{ success }
				</Alert>
			)}
		</Stack>
	);
}
