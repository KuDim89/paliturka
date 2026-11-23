import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

import { envSchema, parseEnv } from './src/shared/config';

// Validate the environment at startup, so a missing or malformed variable stops `next dev` and
// `next build` at once. Next.js loads the .env files before this config.
const env = parseEnv(envSchema, process.env);

const nextConfig: NextConfig = {
  // Agent instructions live in CLAUDE.md; stop `next dev` from writing AGENTS.md.
  agentRules: false,
  // Hosts besides localhost that may open `next dev`, for testing on a phone or tablet
  // (DEV_ALLOWED_ORIGINS in .env.local). Has no effect on production.
  allowedDevOrigins: env.DEV_ALLOWED_ORIGINS,
  // The root layout is app/[locale]/layout.tsx, so URLs that match no route need their own 404
  // document: app/global-not-found.tsx (the approach the Next.js docs give for this layout).
  experimental: { globalNotFound: true },
};

// Points next-intl at the request config that loads the messages for each locale.
const withNextIntl = createNextIntlPlugin('./src/shared/i18n/request.ts');

export default withNextIntl(nextConfig);
