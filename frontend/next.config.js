const nextConfig = {
	transpilePackages: ['@mui/x-charts'],
	async rewrites() {
		return [
			{
			  source: '/api/health/:path*',
			  destination: 'http://api:8000/health/:path*',
			},
			{
			  source: '/api/references/:path*',
			  destination: 'http://api:8000/references/:path*',
			},
			{
			  source: '/api/calculations/:path*',
			  destination: 'http://api:8000/calculations/:path*',
			},
			{
			  source: '/api/reports/:path*',
			  destination: 'http://api:8000/reports/:path*',
			},
			{
			  source: '/api/etl/:path*',
			  destination: 'http://api:8000/etl/:path*',
			},
			// {
			// 	source: '/api/:path*',
			//	destination: 'http://api:8000/:path*', 
			// },
		]
	},
	
	webpack(config) {
		config.module.rules.push({
			test: /\.svg$/i,
			issuer: /\.[jt]sx?$/,
			use: ['@svgr/webpack'],
		});
		return config;
	},
};

module.exports = nextConfig
