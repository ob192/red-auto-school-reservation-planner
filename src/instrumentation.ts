/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        instrumentationHook: true, // required for Next.js < 15.3
    },
};

module.exports = nextConfig;