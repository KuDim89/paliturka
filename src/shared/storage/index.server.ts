import 'server-only';

import { env } from '@/shared/config/index.server';

import {
  cleanupTempFilesAtStartup,
  createLocalBookStorage,
  resolveStorageRoot,
} from './local/local-book-storage';

// The only way the app reaches book files.
export const bookStorage = createLocalBookStorage(
  resolveStorageRoot(env.STORAGE_DIR, process.cwd()),
);

/** Removes temporary files left by crashed writes; called once from `instrumentation.ts`. */
export function cleanupLeftoverTempFiles(): Promise<void> {
  return cleanupTempFilesAtStartup(bookStorage);
}
