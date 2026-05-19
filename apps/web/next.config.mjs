import createNextIntlPlugin from 'next-intl/plugin';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),
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
    return config;
  },
  images: {
    remotePatterns: [
      { protocol: 'http',  hostname: 'localhost' },
      { protocol: 'https', hostname: 'vbceca.s3.us-west-2.amazonaws.com' },
    ],
  },
};

export default withNextIntl(nextConfig);
