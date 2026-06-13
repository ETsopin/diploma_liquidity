const TMP_API_KEY = 'change_me_in_production';

import { HttpMethod } from '@/types/api';

export const fetchAPI = async<TRequest = never, TResponse= any>(
	endpoint: string,
   	httpMethod: HttpMethod = 'GET',
   	payload?: TRequest
): Promise<TResponse> => {
	const options: RequestInit = {	
		method: httpMethod,
		headers: {
			'Content-Type': 'application/json',
			'X-API-Key': TMP_API_KEY, 
		},
	};

	if (payload && ['POST'].includes(httpMethod)) {
		options.body = JSON.stringify(payload);
	}
	
	const response = await fetch(`/api/${endpoint}`, options);

	if (!response.ok) {
		// todo error handle
	}

	return response.json();
};

// GET /health
export const healthCheck = async () => {
	return fetchAPI<never, {status: string; dabase: string }>('health', 'GET');
// const response = await fetch('/api/health');
// if (!response.ok) return null; 
// return response.json();
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
