'use client'

import { useState, FormEvent, ChangeEvent } from 'react';

import { GenerateReportRequest, ReportType, ReportFormat } from '@types/reports';

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
} from '@mui/material';

import {
	PictureAsPdf as PdfIcon,
	Description as ExcelIcon,
	TextSnippet as CsvIcon,
} from '@mui/icons-material';


const formatDate = (date: Date): string => {
	const day = String(date.getDate()).padStart(2, '0');
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const year = date.getFullYear();
	return `${day}/${month}/${year}`;
};

const parseToDate = (dateStr: string): Date => {
	const parts = dateStr.split('/');
	if (parts.length === 3) {
		const day = parseInt(parts[0], 10);
		const month = parseInt(parts[1], 10) - 1;
		const year = parseInt(parts[2], 10);
		return new Date(year, month, day);
	}
	return new Date();
}

const parseToISODate = (dateStr: string): string => {
	const parts = dateStr.split('/');
	if (parts.length === 3) {
		const day = parts[0].padStart(2, '0');
		const month = parts[1].padStart(2, '0');
		const year = parts[2];
		return `${year}-${month}-${day}`;
	}
	return dateStr;
};


const initialState: GenerateReportRequest = {
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
	{ value: 'excel' as const, label: 'Excel (.xlsx)', icon: ExcelIcon },
	{ value: 'csv' as const, label: 'CSV (.csv)', icon: CsvIcon },
	{ value: 'pdf' as const, label: 'PDF (.pdf)', icon: PdfIcon },
];

export default function ReportForm() {
	const [formData, setFormData] = useState<GenerateReportRequest>(initialState);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);


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
			direction="column"
			spacing={4}
			sx={{
				py: 2,
				width: '100%',
			}}
		>
			<Typography variant="h4">
				Новый отчет
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
						<ExcelIcon/>
						Excel (.xlsx)
					</ToggleButton>	
					<ToggleButton value="csv">
						<CsvIcon/>
						CSV (.csv)
					</ToggleButton>	
					<ToggleButton value="pdf">
						<PdfIcon/>
						PDF (.pdf)
					</ToggleButton>	
				</ToggleButtonGroup>
			</Stack>

			<Button 
				variant="contained"
				sx={{
					bgcolor: 'inverse.surface',
					color: 'inverse.onSurface',	
				}}
				onClick={() => {console.log(formData);}}
			>
				Сгенерировать
			</Button>
		</Stack>
	);
}
