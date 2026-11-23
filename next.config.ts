import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

import { envSchema, parseEnv } from './src/shared/config';

// Validate the environment at startup, so a missing or malformed variable stops `next dev` and
// `next build` at once. Next.js loads the .env files before this config.
parseEnv(envSchema, process.env);

const nextConfig: NextConfig = {
  // Agent instructions live in CLAUDE.md; stop `next dev` from writing AGENTS.md.
  agentRules: false,
  // The root layout is app/[locale]/layout.tsx, so URLs that match no route need their own 404
  // document: app/global-not-found.tsx (the approach the Next.js docs give for this layout).
  experimental: { globalNotFound: true },
};

// Points next-intl at the request config that loads the messages for each locale.
const withNextIntl = createNextIntlPlugin('./src/shared/i18n/request.ts');

export default withNextIntl(nextConfig);
