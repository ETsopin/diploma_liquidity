'use client'

import { ReactNode } from 'react';

import Header from '@/components/Layout/Header';
import Sidebar, { LeftSidebar, RightSidebar } from '@/components/Layout/Sidebar';

import { 
	Stack,
	Box,
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
				height: '100%',
			}}
		>
			<Header/>
			<Stack
				direction="row"
				sx={{
					width: '100%',
					display: 'flex',
					justifyContent: 'space-between',	
				}}
			>
				<LeftSidebar />
				{ children }
				<RightSidebar />
			</Stack>
		</Stack>
	);
}
