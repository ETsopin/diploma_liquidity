export const healthCheck = async () => {
	const response = await fetch('/api/health');
	if (!response.ok) return null; 
	return response.json();
};

export const generareReport = async (payload) => {
	const response = await fetch('/api/reports/generate', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(payload),
	});

	const data = await response.json();
	return data;
};

export const getReports = async (limit: number = 50, offset: number = 0) => {
	const response = await fetch(`/api/reports?limit=${limit}&offset=${offset}`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'X-API-Key': 'change_me_in_production',
		},
	});

	const data = await response.json();
	return data;
}; 
