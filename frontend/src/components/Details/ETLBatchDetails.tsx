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
import { getETLBatchDetails } from '@/services/api';
import { ETLBatchDetails } from '@/types/schemas';
import { formatISODateTime } from '@/utils/dateUtils';

const BATCH_ID = 88; // TODO: Dynamic ID

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
  const [data, setData] = useState<ETLBatchDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getETLBatchDetails(BATCH_ID);
        if (response) {
          setData(response);
        } else {
          setError('Не удалось загрузить детали ETL-загрузки');
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
        <Typography variant="h6" fontWeight={600}>
          Детали ETL-загрузки #{BATCH_ID}
        </Typography>

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
