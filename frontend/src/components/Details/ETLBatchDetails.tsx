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
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import PendingIcon from '@mui/icons-material/Pending';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { getETLBatchDetails } from '@/services/api';
import { getLatestBatchId } from '@/services/latest';
import { ETLBatchDetails as ETLBatchDetailsType } from '@/types/schemas';
import { formatISODateTime } from '@/utils/dateUtils';

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

export default function ETLBatchDetails() {
  const [data, setData] = useState<ETLBatchDetailsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [batchId, setBatchId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const latestId = await getLatestBatchId();
        if (latestId) {
          setBatchId(latestId);
          const response = await getETLBatchDetails(latestId);
          if (response) {
            setData(response);
          } else {
            setError('Не удалось загрузить детали ETL-загрузки');
          }
        } else {
          setError('ETL-загрузки не найдены');
        }
      } catch (err) {
        setError('Ошибка при загрузке данных');
        console.error('ETL Batch Details fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <Paper variant="outlined" sx={{ p: 3, width: '100%' }}>
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <CompareArrowsIcon />
          <Typography variant="h6" fontWeight={600}>
            Детали ETL-загрузки #{batchId || '—'}
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
                Источник:
              </Typography>
              <Typography variant="body2">{data.datasource_name}</Typography>
            </Stack>

            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Начало:
              </Typography>
              <Typography variant="body2">{formatISODateTime(data.started_at)}</Typography>
            </Stack>

            {data.finished_at && (
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Завершение:
                </Typography>
                <Typography variant="body2">{formatISODateTime(data.finished_at)}</Typography>
              </Stack>
            )}

            <Divider />

            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Извлечено строк:
              </Typography>
              <Typography variant="body2">{data.rows_extracted ?? '—'}</Typography>
            </Stack>

            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Загружено строк:
              </Typography>
              <Typography variant="body2">{data.rows_loaded ?? '—'}</Typography>
            </Stack>

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
