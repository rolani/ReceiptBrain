/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@receiptbrain/ui', '@receiptbrain/lib', '@receiptbrain/contracts'],
  // sharp, bullmq, ioredis, and @prisma/client are node-only with native or
  // dynamic-require bundles — keep them external so webpack does not try to
  // bundle their internals into Next's server runtime.
  serverExternalPackages: [
    'sharp',
    'bullmq',
    'ioredis',
    '@prisma/client',
    '@aws-sdk/client-s3',
    '@aws-sdk/s3-request-presigner',
    '@smithy/node-http-handler',
    'pdf-to-png-converter',
    '@napi-rs/canvas',
    'pdfjs-dist',
  ],
  experimental: {
    typedRoutes: false,
  },
  // Source files in workspace packages import sibling modules with explicit
  // `.js` extensions (required by Vitest/tsc moduleResolution: Bundler).
  // Next.js webpack does not resolve `.js` to `.ts` by default — this alias bridges them.
  webpack(config) {
    config.resolve = config.resolve ?? {};
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias ?? {}),
      '.js': ['.ts', '.tsx', '.js'],
    };
    return config;
  },
};

export default nextConfig;
