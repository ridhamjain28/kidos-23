/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/iblm/:path*',
        destination: 'http://localhost:8000/iblm/:path*' // Proxy to FastAPI Backend
      }
    ];
  }
};

export default nextConfig;
