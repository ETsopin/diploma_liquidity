'use client'

import { ReactNode } from 'react';

import Header from '@/components/Layout/Header';
import Sidebar, { LeftSidebar, RightSidebar } from '@/components/Layout/Sidebar';

import { 
	Stack,
	Box,
	Paper,
} from '@mui/material';


interface WrapperProps {
	children: ReactNode;
} 

export default function Wrapper({ children }: WrapperProps) {
	return (
		<Stack 
			direction="column"
			sx={{
				width: '100%',
				height: '100vh',
			}}
		>
			<Header/>
			<Stack
				direction="row"
				sx={{
					width: '100%',
					display: 'flex',
					flex: 1,
					justifyContent: 'space-between',	
					pb: 4,
					overflow: 'hidden',
				}}
			>
				<LeftSidebar />
				<Paper 
					elevation={2}
					sx={{
						bgcolor: 'surface.light',
						flex: 1,
						px: 4,
						py: 8,
						borderRadius: 4,
						overflow: 'hidden',
					}}
				>
					<Stack
						direction="column"
						sx={{
							px: 10,
							width: '100%',
							height: '100%',
							overflow: 'auto',
						}}
					>
						{ children }
					</Stack>
				</Paper>
				<RightSidebar />
			</Stack>
		</Stack>
	);
}
