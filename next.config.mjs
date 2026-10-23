/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  experimental: {
    // Keep native/server-only packages out of the webpack bundle.
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs', 'nodemailer'],
  },
};

export default nextConfig;
