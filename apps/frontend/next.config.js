/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true, // Useful for simple local/docker execution
  },
};

module.exports = nextConfig;
