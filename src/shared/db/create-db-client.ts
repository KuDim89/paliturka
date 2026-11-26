import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

import { PrismaClient } from '../../../generated/prisma/client';

/** Creates a database client for a SQLite `file:` URL. */
export function createDbClient(url: string): PrismaClient {
  // The SQLite driver creates the database file but not its folder.
  mkdirSync(path.dirname(path.resolve(url.slice('file:'.length))), { recursive: true });

  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });
}
