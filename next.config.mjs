/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
  async rewrites() {
    return [
      {
        source: '/socket.io/:path*',
        destination: 'https://websocket-server-sonox-5b86c53b93d9.herokuapp.com/socket.io/:path*',
      },
    ]
  },
  webpack: (config) => {
    config.externals.push({
      "utf-8-validate": "commonjs utf-8-validate",
      bufferutil: "commonjs bufferutil"
    });
    return config;
  },
  output: 'standalone',
}

export default nextConfig;
