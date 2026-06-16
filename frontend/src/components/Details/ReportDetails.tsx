'use client';

import { useState, useEffect } from 'react';
import {
  Paper,
  Stack,
  Typography,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  Button,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import PendingIcon from '@mui/icons-material/Pending';
import DownloadIcon from '@mui/icons-material/Download';
import DescriptionIcon from '@mui/icons-material/Description';
import { getReportById } from '@/services/api';
import { formatISODateTime } from '@/utils/dateUtils';
import { getLatestReportId } from '@/services/latest';

const getStatusChip = (status: string) => {
  switch (status) {
    case 'success':
      return <Chip icon={<CheckCircleIcon />} label="Успешно" color="success" size="small" />;
    case 'error':
      return <Chip icon={<ErrorIcon />} label="Ошибка" color="error" size="small" />;
    case 'processing':
      return <Chip icon={<PendingIcon />} label="В процессе" color="warning" size="small" />;
    default:
      return <Chip label={status} size="small" />;
  }
};

export default function ReportDetails() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportId, setReportId] = useState<number | null>(null);

  useEffect(() => {
    const loadLatestReport = async () => {
      setLoading(true);
      try {
        const latestId = await getLatestReportId();
        if (latestId) {
          setReportId(latestId);
          const response = await getReportById(latestId);
          if (response) {
            setData(response);
          } else {
            setError('Не удалось загрузить детали отчета');
          }
        } else {
          setError('Отчеты не найдены');
        }
      } catch (err) {
        setError('Ошибка при загрузке данных');
        console.error('Report Details fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadLatestReport();
  }, []);


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
  
  		link.remove();
  		window.URL.revokeObjectURL(url);
  	} catch (err) {
  		console.error('Download error: ', err);
  	}
  };

  return (
    <Paper variant="outlined" sx={{ p: 3, width: '100%' }}>
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <DescriptionIcon />
          <Typography variant="h6" fontWeight={600}>
			  Детали отчета #{reportId || '—'}
          </Typography>
        </Stack>

        <Divider />

        {loading ? (
          <Stack alignItems="center" py={4}>
            <CircularProgress />
          </Stack>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : data ? (
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Статус:
              </Typography>
              {getStatusChip(data.status)}
            </Stack>

            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Тип отчета:
              </Typography>
              <Typography variant="body2">
                {data.report_type === 'full' && 'Полный'}
                {data.report_type === 'gap' && 'ГЭП-анализ'}
                {data.report_type === 'concentration' && 'Концентрация'}
              </Typography>
            </Stack>

            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Формат:
              </Typography>
              <Typography variant="body2">{data.report_format?.toUpperCase()}</Typography>
            </Stack>

            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Дата отчета:
              </Typography>
              <Typography variant="body2">{formatISODateTime(data.report_date)}</Typography>
            </Stack>

            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Создан:
              </Typography>
              <Typography variant="body2">{formatISODateTime(data.created_at)}</Typography>
            </Stack>

            {data.finished_at && (
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Завершен:
                </Typography>
                <Typography variant="body2">{formatISODateTime(data.finished_at)}</Typography>
              </Stack>
            )}

            {data.file_path && (
              <>
                <Divider />
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleDownload(reportId, data.file_path)}
                >
                  Скачать файл
                </Button>
              </>
            )}

            {data.error_message && (
              <>
                <Divider />
                <Stack>
                  <Typography variant="body2" color="error.main">
                    Ошибка:
                  </Typography>
                  <Typography variant="body2" color="error.main">
                    {data.error_message}
                  </Typography>
                </Stack>
              </>
            )}
          </Stack>
        ) : (
          <Alert severity="warning">Данные не найдены</Alert>
        )}
      </Stack>
    </Paper>
  );
}
