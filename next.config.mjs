/** @type {import('next').NextConfig} */
const areteOrigin = process.env.ARETE_SAPIENS_ORIGIN || 'http://127.0.0.1:8080';

const nextConfig = {
  serverExternalPackages: ['tesseract.js'],
  async rewrites() {
    return [
      { source: '/vaakil', destination: `${areteOrigin}/` },
      { source: '/vaakil/:path*', destination: `${areteOrigin}/:path*` },
      { source: '/api/vaakil/:path*', destination: `${areteOrigin}/api/vaakil/:path*` },
      { source: '/api/premium-status', destination: `${areteOrigin}/api/premium-status` },
      { source: '/api/activate-trial', destination: `${areteOrigin}/api/activate-trial` },
      { source: '/api/risk-score', destination: `${areteOrigin}/api/risk-score` },
      { source: '/api/alerts/:path*', destination: `${areteOrigin}/api/alerts/:path*` },
      { source: '/api/bills/:path*', destination: `${areteOrigin}/api/bills/:path*` },
      { source: '/api/subscriptions/:path*', destination: `${areteOrigin}/api/subscriptions/:path*` },
      { source: '/api/warranties/:path*', destination: `${areteOrigin}/api/warranties/:path*` },
      { source: '/api/groceries/:path*', destination: `${areteOrigin}/api/groceries/:path*` },
      { source: '/api/run-checks', destination: `${areteOrigin}/api/run-checks` },
      { source: '/api/seed-demo', destination: `${areteOrigin}/api/seed-demo` },
      { source: '/api/advocates', destination: `${areteOrigin}/api/advocates` },
      { source: '/api/advocates/:path*', destination: `${areteOrigin}/api/advocates/:path*` },
      { source: '/api/consultation-requests', destination: `${areteOrigin}/api/consultation-requests` },
    ];
  },
};

export default nextConfig;
