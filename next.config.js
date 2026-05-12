/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    instrumentationHook: true, // required for Next.js < 15.3
  }
};

module.exports = nextConfig;
