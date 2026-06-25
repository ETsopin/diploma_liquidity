'use client'

import { useState, FormEvent } from 'react';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  TextField,
  MenuItem,
  Button,
  Alert,
} from '@mui/material';

import PersonAddIcon from '@mui/icons-material/PersonAdd';


const ROLE_OPTIONS = [
  { value: 'admin', label: 'Администратор' },
  { value: 'analyst', label: 'Аналитик' },
  { value: 'viewer', label: 'Наблюдатель' },
];

interface CreateUserDialogProps {
  open: boolean;
  onClose: () => void;
  onUserCreated: () => void;  
}

export default function CreateUserDialog({ open, onClose, onUserCreated }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    role: 'viewer',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Ошибка при создании пользователя');
      }

      onUserCreated();
      onClose();
      setFormData({ email: '', password: '', first_name: '', middle_name: '', last_name: '', role: 'viewer' });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <Stack component="form" onSubmit={handleSubmit}>
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <PersonAddIcon />
            <span>Создать пользователя</span>
          </Stack>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Email" type="email" value={formData.email} onChange={handleChange('email')} required />
            <TextField label="Пароль" type="password" value={formData.password} onChange={handleChange('password')} required />
            <TextField label="Фамилия" value={formData.last_name} onChange={handleChange('last_name')} required />
            <TextField label="Имя" value={formData.first_name} onChange={handleChange('first_name')} required />
            <TextField label="Отчество" value={formData.middle_name} onChange={handleChange('middle_name')} />
            <TextField label="Роль" select value={formData.role} onChange={handleChange('role')}>
              {ROLE_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </TextField>

            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Отмена</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Создание...' : 'Создать'}
          </Button>
        </DialogActions>
      </Stack>
    </Dialog>
  );
}
