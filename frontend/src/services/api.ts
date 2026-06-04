export const healthCheck = async () => {
	const response = await fetch('/api/health');
	if (!response.ok) return null; 
	return response.json();
}
