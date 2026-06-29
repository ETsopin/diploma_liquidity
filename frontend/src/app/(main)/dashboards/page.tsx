'use client'

import { useState } from 'react';

import ContentStack from '@/components/Layout/ContentStack';
import GapTrendLine from '@/components/Dashboards/widgets/GapTrendLine';
import ConcentrationTrendLine from '@/components/Dashboards/widgets/ConcentrationTrendLine';
import ComparisonBar from '@/components/Dashboards/widgets/ComparisonBar';
import KpiRow from '@/components/Dashboards/widgets/KpiRow';
import ReportTable from '@/components/Dashboards/widgets/ReportTable';

import GapBarWidget from '@/components/Dashboards/widgets/GapBarWidget';
import ConcentrationPieWidget from '@/components/Dashboards/widgets/ConcentrationPieWidget';

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
			<KpiRow />
			<Stack
				direction="row"
				sx={{
					width: '100%',
				}}
				spacing={2}
			>
				<GapBarWidget />
				<ConcentrationPieWidget />
			</Stack>
			<Stack
				direction="row"
				sx={{
					width: '100%',
				}}
				spacing={2}
			>
				<GapTrendLine />
				<ConcentrationTrendLine />
			</Stack>
			<ComparisonBar />
			<ReportTable />
	    </ContentStack>
	);
};
