import type { NextConfig } from 'next';

// Address of the FastAPI backend, as seen from the machine running Next.js.
// Needs to be set before `npm run dev` / `npm run build`.
const API_URL = (process.env.API_URL ?? 'http://localhost:8000').replace(/\/$/, '');

const nextConfig: NextConfig = {
  // The browser only ever talks to this site; these rules forward API calls and uploaded
  // files to the backend. That is what makes project images, view counting and the host
  // dashboard work from a phone or any other device, not just the computer running the API.
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${API_URL}/api/:path*` },
      { source: '/files/:path*', destination: `${API_URL}/files/:path*` },
    ];
  },

  // Forwarded requests are buffered by Next.js and cut off after 10 MB by default, which
  // would break uploads between 10 and 15 MB (the API's limit, MAX_UPLOAD_MB). Keep this a
  // few MB above MAX_UPLOAD_MB. (The multipart wrapper adds a little to the file size.)
  experimental: {
    proxyClientMaxBodySize: '20mb',
  },

  // Development only: lets you open the dev server from a phone or another computer on your
  // home network (any 192.168.x.x / 10.x.x.x / 172.x.x.x address). Without it Next blocks
  // hot-reload and dev resources for those addresses. Ignored in production builds.
  allowedDevOrigins: ['192.168.*.*', '10.*.*.*', '172.*.*.*'],
};

export default nextConfig;