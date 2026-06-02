/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://api:8000/api/:path*', // обращение к ядру по имени сервиса
      },
    ]
  },
}

module.exports = nextConfig
