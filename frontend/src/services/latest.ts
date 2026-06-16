import { getCalculations, getReports } from './api';
import { CalculationRecord, CalcType } from '@/types';

export const getLatestCalculationDate = async (
	calcType: CalcType
): Promise<string | null> => {
	try {
		const response = await getCalculations();
		if (!response || !response.items) return null;

		const filtered = response.items.filter(
			(item) => (item.calc_type === calcType || item.calc_type === 'full') && item.status === 'success'
		);

		if (filtered.length === 0) return null;

		const sorted = filtered.sort(
			(a, b) => new Date(b.report_date).getTime() - new Date(a.report_date).getTime()
		);

		return sorted[0].report_date;

	} catch (err) {
		console.error(`getLatestCalculationDate (${calcType})Failed:`, err);
		return null;
	}
};

export const getLatestCalculationId = async (): Promise<number | null> => {
	try {
		const response = await getCalculations(1, 0);
		if (!response || !response.items || response.items.length === 0) return null;
		
		const latestCalculation = response.items[0];
		return latestCalculation?.id || null;
	} catch (error) {
		console.error('getLatestCalculationId failed:', error);
		return null;
	}
};

export const getLatestReportDate = async (
	reportType: CalcType
): Promise<string | null> => {
	try {
		const response = await getReports();
		if (!response || !response.items) return null;

		const filtered = response.items.filter(
			(item) => (item.report_type === reportType) && item.status === 'success'
		);

		if (filtered.length === 0) return null;

		const sorted = filtered.sort(
			(a, b) => new Date(b.report_date).getTime() - new Date(a.report_date).getTime()
		);

		return sorted[0].report_date;

	} catch (err) {
		console.error(`getLatestReportDate (${reportType})Failed:`, err);
		return null;
	}
};

export const getLatestReportId = async (): Promise<string | null> => {
	try {
		const response = await getReports();
		if (!response || !response.items) return null;

		return response.items[0].id;
	} catch (err) {
		console.error(`getLatestReportID Failed:`, err);
	}
};
