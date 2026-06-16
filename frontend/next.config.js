const nextConfig = {
	transpilePackages: ['@mui/x-charts'],
	async rewrites() {
		return [
			{
				source: '/api/:path*',
				destination: 'http://api:8000/:path*', // обращение к ядру по имени сервиса
			},
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
