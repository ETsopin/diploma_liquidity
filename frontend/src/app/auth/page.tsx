'use client';

import { useEffect, useState } from 'react';
import { Container, Typography, TextField, Button, InputAdornment, Stack, Box} from '@mui/material';
import Image from 'next/image';


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
						<Image
							src='/logo-dark.png'
							alt='Company Logo'
							fill
							size='64px'
							style={{ objectFit: 'contain' }}
						/>
					</Box>
					<Typography variant='h4'>Авторизация</Typography>
					<Typography variant='subtitle1'>Для начала работы в <b>Liquidity Analytics</b> пройдите процесс авторизации.</Typography>
				</Stack>
				<TextField
					id='login'
					label='Имя пользователя'
				>
				</TextField>
				<TextField
					id='password'
					label='Пароль'
					type='password'
				>
				</TextField>
				<Button
				   variant='contained'
				   size='large'
				>
					Войти
				</Button>
			</Stack>
		</Container>
	);
}
