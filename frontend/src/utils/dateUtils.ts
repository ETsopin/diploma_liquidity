export const formatDate = (date: Date): string => {
	const day = String(date.getDate()).padStart(2, '0');
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const year = date.getFullYear();
	return `${day}/${month}/${year}`;
};

export const parseToDate = (dateStr: string): Date => {
	const parts = dateStr.split('/');
	if (parts.length === 3) {
		const day = parseInt(parts[0], 10);
		const month = parseInt(parts[1], 10) - 1;
		const year = parseInt(parts[2], 10);
		return new Date(year, month, day);
	}
	return new Date();
};

export const parseToISODate = (dateStr: string): string => {
	const parts = dateStr.split('/');
	if (parts.length === 3) {
		const day = parts[0].padStart(2, '0');
		const month = parts[1].padStart(2, '0');
		const year = parts[2];
		return `${year}-${month}-${day}`;
	}
	return dateStr;
};


export const getMonthStart = (): string => {
	const date = new Date();
	date.setDate(1);
	return formatDate(date);
};

export const getQuarterStart = (): string => {
	const date = new Date();
	const quarter = Math.floor(date.getMonth() / 3);
	date.setMonth(quarter * 3, 1);
	return formatDate(date);
};

export const getYearStart = (): string => {
	const date = new Date();
	date.setMonth(0, 1);
	return formatDate(date);
};
