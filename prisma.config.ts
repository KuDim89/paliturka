import nextEnv from '@next/env';
import { defineConfig } from 'prisma/config';

// The Prisma CLI does not read .env files; this is the loader Next.js uses for the app.
nextEnv.loadEnvConfig(process.cwd());

// Empty is allowed: `prisma generate` runs on install, before .env.local exists.
const url = process.env.DATABASE_URL ?? '';

// Prisma Studio 7.10 only recognizes URLs with "://"; the other commands need the plain form.
// Recheck this when updating Prisma.
const isStudio = process.argv.includes('studio');

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: isStudio ? url.replace(/^file:(?!\/\/)/, 'file://') : url,
  },
});
