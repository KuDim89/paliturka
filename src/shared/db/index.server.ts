import 'server-only';

import { env } from '@/shared/config/index.server';

import { createDbClient } from './create-db-client';

// Hot reload re-evaluates this module, so the client is kept outside it.
const globalForDb = globalThis as typeof globalThis & {
  paliturkaDb?: ReturnType<typeof createDbClient>;
};

globalForDb.paliturkaDb ??= createDbClient(env.DATABASE_URL);

export const db = globalForDb.paliturkaDb;
