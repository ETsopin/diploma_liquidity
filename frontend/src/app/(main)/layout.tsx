'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Stack, CircularProgress } from '@mui/material';

import Wrapper from '@/components/Layout/Wrapper';

import {  useAuth } from '@/context/AuthContext';

export default function MainLayout({ children }: { children: ReactNode }) {
	const router = useRouter();
	const { user, loading } = useAuth();

	useEffect(() => {
		if (!loading && !user) router.push('/auth');
	}, [loading, user]);

	if (loading) return (
		<Stack
			sx={{
				width: '100%',
				height: '100vh',
				justifyContent: 'center',
				alignItems: 'center',
			}}
		>
			<CircularProgress />
		</Stack>
	);

	return (
		<Wrapper>
			{children}
		</Wrapper>
	);
}
