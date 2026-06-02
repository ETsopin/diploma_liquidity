'use client';

import { useEffect, useState } from 'react';
import { 
	Container,
   	Typography, 
	TextField, 
	Button, 
	InputAdornment, 
	Stack, 
	Box,
	SvgIcon
} from '@mui/material';
import Logo from '@/components/Logo'
import LoginIcon from '@mui/icons-material/Login';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LockIcon from '@mui/icons-material/Lock';

export default function Auth() {
	const [login, setLogin] = useState<string | null>(null);
	const [password, setPassword] = useState<string | null>(null);
	
	return (
		<Container sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>
			<Stack direction='column' spacing={4} sx={{width: '330px'}}>
				<Stack direction='column' spacing={2} sx={{alignItems: 'center'}}>
					<Box
						sx={{ 
							width: 64, 
							height: 64, 
							position: 'relative', 
							display: 'flex',
							alignItems: 'center'
						}}
					>
						<Logo color="on-surface" sx={{fontSize: 64}} />
					</Box>
					<Typography variant='h1'>Авторизация</Typography>
					<Typography variant='subtitle1'>Для начала работы в <b>Liquidity Analytics</b> пройдите процесс авторизации.</Typography>
				</Stack>
				<Stack direction='column' spacing={2}>
					<TextField
						id='login'
						label='Имя пользователя'
						helperText='Введите имя пользователя'
						fullwidth
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<AccountCircleIcon />
								</InputAdornment>
							),
						}}
					>
					</TextField>
					<TextField
						id='password'
						label='Пароль'
						type='password'
						helperText='Введите пароль'
						fullwidth
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<LockIcon />
								</InputAdornment>
							),
						}}
					>
					</TextField>
				</Stack>
				<Button
				   variant='contained'
				   size='large'
				   endIcon={<LoginIcon />}
				   sx={{
					   bgcolor: 'inverse.surface',
					   color: 'inverse.onSurface',
				   }}
				>
					Войти
				</Button>
			</Stack>
		</Container>
	);
}
