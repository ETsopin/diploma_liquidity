'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Stack, CircularProgress } from '@mui/material';

import Wrapper from '@/components/Layout/Wrapper';

export default function MainLayout({ children }: { children: ReactNode }) {
	const router = useRouter();
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const validateToken = async () => {
			try {
				const response = await fetch('/api/auth/validate', {
					credentials: 'include',
				});
				console.log('Validate token response:', response);
				if (!response.ok) {
					router.push('/auth');
				}
			} catch (err) {
				router.push('/auth');
			} finally {
				setLoading(false);
			}
		};

		validateToken();
	}, []);

	return <Wrapper>{children}</Wrapper>;
}
