'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	Container,
	Typography,
	TextField,
	Button,
	InputAdornment,
	Stack,
	Box,
	Alert,
	CircularProgress,
} from '@mui/material';
import Logo from '@/components/Logo';
import LoginIcon from '@mui/icons-material/Login';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LockIcon from '@mui/icons-material/Lock';

export default function Auth() {
	const router = useRouter();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		try {
			const response = await fetch('/api/auth/login', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email, password }),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || 'Ошибка входа');
			}

			localStorage.setItem('accessToken', data.accessToken);
			localStorage.setItem('refreshToken', data.refreshToken);
			console.log(data.accessToken);
			console.log(data.refreshToken);

			router.push('/');
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Произошла ошибка');
		} finally {
			setLoading(false);
		}
	};

	return (
		<Container
			sx={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				height: '100vh',
			}}
		>
			<Stack
				component="form"
				onSubmit={handleSubmit}
				direction="column"
				spacing={4}
				sx={{ width: '330px' }}
			>
				<Stack direction="column" spacing={2} sx={{ alignItems: 'center' }}>
					<Box
						sx={{
							width: 64,
							height: 64,
							position: 'relative',
							display: 'flex',
							alignItems: 'center',
						}}
					>
						<Logo color="on-surface" sx={{ fontSize: 64 }} />
					</Box>
					<Typography variant="h5">Авторизация</Typography>
					<Typography variant="body2" color="text.secondary" align="center">
						Для начала работы в <b>Liquidity Analytics</b> пройдите процесс
						авторизации.
					</Typography>
				</Stack>

				{error && <Alert severity="error">{error}</Alert>}

				<Stack direction="column" spacing={2}>
					<TextField
						label="Email"
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<AccountCircleIcon />
								</InputAdornment>
							),
						}}
					/>
					<TextField
						label="Пароль"
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<LockIcon />
								</InputAdornment>
							),
						}}
					/>
				</Stack>

				<Button
					type="submit"
					variant="contained"
					size="large"
					disabled={loading}
					endIcon={loading ? <CircularProgress size={20} /> : <LoginIcon />}
					sx={{
						bgcolor: 'inverse.surface',
						color: 'inverse.onSurface',
						'&:hover': {
							bgcolor: 'inverse.surface',
							opacity: 0.8,
						},
					}}
				>
					{loading ? 'Вход...' : 'Войти'}
				</Button>
			</Stack>
		</Container>
	);
}
