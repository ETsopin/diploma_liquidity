export const healthCheck = async () => {
	const response = await fetch('/api/health');
	if (!response.ok) return null; 
	return response.json();
}

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
}
