import { ReactNode } from 'react';

import {
	Stack
} from '@mui/material';


export default function ContentStack({children} : ReactNode) {
	return (
		<Stack
			direction="column"
			spacing={3}
			sx={{
				px: 10,
				width: '100%',
				height: '100%',
				overflow: 'auto',
			}}
		>
			{children}
		</Stack>
	);
}
