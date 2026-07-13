/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },

  // Allow the ad script domain
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://acscdn.com http://acscdn.com",
            "connect-src 'self' https://acscdn.com http://acscdn.com",
            "frame-src 'self'",
            "img-src 'self' data: https://acscdn.com http://acscdn.com",
            "style-src 'self' 'unsafe-inline'",
          ].join('; '),
        },
      ],
    },
  ],
}

export default nextConfig
