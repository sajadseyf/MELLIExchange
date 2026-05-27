import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// Locale-less paths that next-intl middleware redirects with 307.
// Declaring them here as 308 ensures Google treats them as permanently moved,
// and these run before middleware so they take precedence.
const STATIC_PATHS = ['/currencies', '/gold', '/products', '/news', '/faq', '/about', '/contact'];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      // Root → default locale (permanent)
      { source: '/', destination: '/en', permanent: true },
      // All top-level static paths → /en/... (permanent)
      ...STATIC_PATHS.map((p) => ({
        source: p,
        destination: `/en${p}`,
        permanent: true,
      })),
      // Trailing-slash variants
      { source: '/en/', destination: '/en', permanent: true },
      ...STATIC_PATHS.map((p) => ({
        source: `/en${p}/`,
        destination: `/en${p}`,
        permanent: true,
      })),
    ];
  },
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
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
    ],
  },
};

export default withNextIntl(nextConfig);
