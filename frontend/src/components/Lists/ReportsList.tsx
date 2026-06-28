'use client'

import { useState, useEffect } from 'react';

import { ReportTaskRecord } from '@/types/reports';
import { getReports } from '@/services/api';
import { formatISODate, formatISODateTime } from '@/utils/dateUtils'

import { 
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	IconButton,
	Stack,
	Typography,
} from '@mui/material';

import DescriptionIcon from '@mui/icons-material/Description';
import DownloadIcon from '@mui/icons-material/Download';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LoopIcon from '@mui/icons-material/Loop';

export default function ReportsList() {
	const [reports, setReports] = useState<ReportTaskRecord[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [limit, setLimit] = useState(10);
	const [offset, setOffset] = useState(0);
	const [total, setTotal] = useState(0);

	const fetchReports = async () => {
		setLoading(true);

		try {
			const data = await getReports(limit, offset);
			setReports(data.items || []);
			setTotal(data.total || 0);
			setError(null);
		
		} catch (err) {
			setError('При загрузке списка отчетов возникла ошибка!')
			console.log('GET REPORTS LIST FAILED: ', err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchReports();
	}, [limit, offset]);

	const handleNextPage = () => {
		if (offset + limit < total) {
			setOffset(offset + limit);
		}
	};

	const handlePrevPage = () => {
		if (offset - limit >= 0) {
			setOffset(offset - limit);
		}
	};

	const handleDownload = async (taskId: number, fileName: string) => {
		try {
			const response = await fetch(`/api/reports/${taskId}/download`, {
				method: 'GET',
				headers: {
					'X-API-Key': 'change_me_in_production',
				},
			});

			if (!response.ok) {
				throw new Error('Ошибка при скачивании файла');
			}

			const blob = await response.blob();

			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = fileName;
			document.body.appendChild(link);
			link.click();

			fetch('/api/logs', {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify({
					action: 'download_report',
					entity: 'report',
					entity_id: String(taskId),
					status: 'success',
				}),
			}).catch(() => {});

			link.remove();
			window.URL.revokeObjectURL(url);
		} catch (err) {
			console.error('Download error: ', err);
		}
	};

	if (loading) {
	
	}

	if (error) {
	}

	if (reports.length === 0) {
	
	}

	return (
		<Stack
			direction="column"
			sx={{
				width: '100%'
			}}
		>
			<Stack
				direction="row"
				alignItems="center"
			>
				<IconButton
					onClick={handlePrevPage}
					disabled={offset === 0}
					size='small'
				>
					<ChevronLeftIcon/>
				</IconButton>

				<IconButton
					onClick={handleNextPage}
					disabled={offset + limit >= total}
					size='small'
				>
					<ChevronRightIcon/>
				</IconButton>
				<Typography 
					variant="body" 
					color="text.secondary"
					sx={{
						px: 1
					}}
				>
					{offset + 1}-{Math.min(offset + limit, total)} из {total}
				</Typography>
				<IconButton
					onClick={fetchReports}
					size='small'
					color='tertiary'
				>
					<LoopIcon />
				</IconButton>
			</Stack>
			<List>
				{reports.map((report) => (
					<ListItem
						key={report.id}
						divider
						secondaryAction={
							<IconButton 
								edge="end"
								aria-label="download"
								onClick={() => handleDownload(report.id, report.report_name)}
								disabled={!report.file_path}
							>
								<DownloadIcon />
							</IconButton>
						}
					>
						<ListItemIcon>
							<DescriptionIcon />
						</ListItemIcon>

						<ListItemText
							primary={
								`${formatISODate(report.report_date)} - ${report.report_type} (${report.report_format})`
							}

							secondary={report.report_name}
						/>
					</ListItem>
				))}
			</List>
		</Stack>
	);

}
