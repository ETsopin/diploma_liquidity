const TMP_API_KEY = 'change_me_in_production';

import { 
	HttpMethod,
	HealthResponse,
	TimebucketInfo,
	ETLBatchDetails, 
	CounterPartiesResponse,
	ConcentrationResponse,
	GapAnalysisResponse,
} from '@/types';

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
		console.error('fetchAPI Failed Response:', response);
	}

	return response.json();
};

// GET /health
export const healthCheck = async () => {
	try {
		return fetchAPI<never, HealthResponse>('health');
	} catch {
		console.error("getHealth API Fetch Error:", err);
		return null;
	}
};

// GET references/timebuckets
export const getTimebuckets = async () => {
	try {
		return fetchAPI<never, TimebucketInfo>('references/timebuckets');
	} catch {
		console.error("getTimebuckets API Fetch Error:", err);
		return null;
	}
};

// GET /references/couterparties
export const getCounterparties = async (
	search?: string,
	limit: number = 50,
	offset: number = 0

): Promise<CounterpartiesResponse | null> => {

	let endpoint = `references/counterparties?limit=${limit}&offset=${offset}`;
	try {
		if (search) {
			endpoint += `&search=${encodeURIComponent(search)}`;
		}

	} catch (err) {
		console.error("getCounterparties API Fetch Error:", err);
		return null;
	}

	return await fetchAPI<never, CounterpartiesResponse>(endpoint);
}

// GET /calculations/concentration
export const getConcentration = async (
	reportDate: string,
	category: 'asset' | 'liability' = 'liability',
	calculationId?: number,
	limit: number = 10,
	offset: number = 0
): Promise<ConcentrationResponse | null> => {
	let endpoint = `calculations/concentration/${reportDate}?category=${category}&limit=${limit}&offset=${offset}`;

	if (calculationId) {
		endpoint += `&calculation_id=${calculationId}`;
	}

	try {
		return await fetchAPI<never, ConcentrationResponse>(endpoint);
	} catch (err) {
		console.error("getConcentration API Fetch Error:", err);
		return null;
	}
};

// GET /calculations/gap/
export const getGapAnalysis = async (
	reportDate: string,
	calculationId?: number
): Promise<GapAnalysisResponse | null> => {
	let endpoint = `calculations/gap/${reportDate}`;
	if (calculationId) {
		endpoint += `?calculation_id=${calculationId}`;
	}

	try {
		return await fetchAPI<never, GapAnalysisResponse>(endpoint);
	} catch (err) {
		console.error("getGap API Fetch Error:", err);
		return null;
	}
};

// GET /etl/batches/{batch_id}
export const getETLBatchDetails = async (
	batchId: number
) : Promise<ETLBatchDetails | null> => {
	try {
		return await fetchAPI<never, ETLBatchDetails>(`etl/batches/${batchId}`);
	
	} catch (err) {
		console.error("getETLBatchDeatils API Fetch Error:", err);
		return null;
	}
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
