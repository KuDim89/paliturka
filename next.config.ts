import type { NextConfig } from 'next';

import { envSchema, parseEnv } from './src/shared/config';

// Validate the environment at startup, so a missing or malformed variable stops `next dev` and
// `next build` at once. Next.js loads the .env files before this config.
parseEnv(envSchema, process.env);

const nextConfig: NextConfig = {
  // Agent instructions live in CLAUDE.md; stop `next dev` from writing AGENTS.md.
  agentRules: false,
};

export default nextConfig;
