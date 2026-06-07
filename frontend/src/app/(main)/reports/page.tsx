'use client';

import ContentStack from '@/components/Layout/ContentStack';
import ReportForm from '@/components/Forms/ReportForm';

import { 
	Stack,
	Typography, 
} from '@mui/material';

export default function Reports() {
	return (
	    <ContentStack>
			<Stack 
				direction="row"
				sx={{
					justifyContent: 'space-between',
					py: 2,
				}}
			>
				<Typography variant="h2">{'Отчетность'}</Typography>
			</Stack>
			<ReportForm/>
	    </ContentStack>
	);
}
