const TMP_API_KEY = 'change_me_in_production';

// GET /health
export const healthCheck = async () => {
	const response = await fetch('/api/health');
	if (!response.ok) return null; 
	else data = await response.json();
	return data;
};

// POST /reports/generate
export const generareReport = async (payload) => {
	const response = await fetch('/api/reports/generate', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-API-Key': `${TMP_API_KEY}`,
		},
		body: JSON.stringify(payload),
	});

	const data = await response.json();
	return data;
};

// GET /reports
export const getReports = async (limit: number = 50, offset: number = 0) => {
	const response = await fetch(`/api/reports?limit=${limit}&offset=${offset}`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'X-API-Key': `${TMP_API_KEY}`,
		},
	});

	const data = await response.json();
	return data;
}; 

// GET /etl/batches
export const getETLBatches = async (limit: number = 50, offset: number = 0 ) => {
	const response = await fetch(`/api/etl/baches?limit=${limit}&offset=${offset}`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'X-API-Key': `${TMP_API_KEY}`,
		},
	});

	const data = await response.json();
	return data;
};

// GET /calculations
export const getCalculations = async (limit: number = 50 , offset: number = 0) => {
	const response = await fetch(`/api/calculations?limit=${limit}&offset=${offset}`, {
		method: 'GET',
		headers: {
			'Content-Type': 'aplication/json',
			'X-API-Key': `${TMP_API_KEY}`,
		},
	});

	const data = await response.json();
	return data;
};
