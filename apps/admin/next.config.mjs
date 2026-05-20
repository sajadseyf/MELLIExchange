/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@melli/ui', '@melli/types', '@melli/api'],
  experimental: {
    serverComponentsExternalPackages: ['mongoose', 'sharp', 'bcryptjs', 'nodemailer', 'twilio'],
  },
  webpack(config) {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
      '.mjs': ['.mts', '.mjs'],
    };
    config.externals = [
      ...(Array.isArray(config.externals) ? config.externals : []),
      'sharp',
      'aws4',
    ];
    return config;
  },
};

export default nextConfig;
