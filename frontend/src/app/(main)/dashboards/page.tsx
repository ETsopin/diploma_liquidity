'use client'

import { useState } from 'react';

import ContentStack from '@/components/Layout/ContentStack';

import {
	Stack,
	Typography,
} from '@mui/material';

export default function Admin() {
	return (
	    <ContentStack>
			<Stack 
				direction="row"
				sx={{
					justifyContent: 'space-between',
				}}
			>
				<Typography variant="h2">Визуализация</Typography>
			</Stack>
	    </ContentStack>
	);
};
