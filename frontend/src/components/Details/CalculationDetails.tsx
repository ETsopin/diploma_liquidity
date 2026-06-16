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
import CalculateIcon from '@mui/icons-material/Calculate';
import { getCalculationById } from '@/services/api';
import { getLatestCalculationId } from '@/services/latest';
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

const getCalcTypeLabel = (calcType: string) => {
  switch (calcType) {
    case 'full':
      return 'Полный расчет';
    case 'gap':
      return 'ГЭП-анализ';
    case 'concentration':
      return 'Концентрация';
    default:
      return calcType;
  }
};

export default function CalculationDetails() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calcId, setCalcId] = useState<number | null>(null);

  useEffect(() => {
    const loadLatestCalculation = async () => {
      setLoading(true);
      try {
        const latestId = await getLatestCalculationId();
        if (latestId) {
          setCalcId(latestId);
          const response = await getCalculationById(latestId);
          if (response) {
            setData(response);
          } else {
            setError('Не удалось загрузить детали расчета');
          }
        } else {
          setError('Расчеты не найдены');
        }
      } catch (err) {
        setError('Ошибка при загрузке данных');
        console.error('Calculation Details fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadLatestCalculation();
  }, []);

  return (
    <Paper variant="outlined" sx={{ p: 3, width: '100%' }}>
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <CalculateIcon />
          <Typography variant="h6" fontWeight={600}>
            Детали расчета #{calcId || '—'}
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
                Тип расчета:
              </Typography>
              <Typography variant="body2">{getCalcTypeLabel(data.calc_type)}</Typography>
            </Stack>

            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Дата отчета:
              </Typography>
              <Typography variant="body2">{formatISODateTime(data.report_date)}</Typography>
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
