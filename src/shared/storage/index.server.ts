import 'server-only';

import { env } from '@/shared/config/index.server';

import { createLocalBookStorage, resolveStorageRoot } from './local/local-book-storage';

// The only way the app reaches book files.
export const bookStorage = createLocalBookStorage(
  resolveStorageRoot(env.STORAGE_DIR, process.cwd()),
);
