import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

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
  images: {
    remotePatterns: [
      { protocol: 'http',  hostname: 'localhost' },
      { protocol: 'https', hostname: 'vbceca.s3.us-west-2.amazonaws.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
};

export default withNextIntl(nextConfig);
