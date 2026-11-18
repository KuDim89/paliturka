// Safe to import in tests. Server code uses the `bookStorage` instance from `index.server.ts`.
export type { BookStorage } from './book-storage';
export { createLocalBookStorage, resolveStorageRoot } from './local/local-book-storage';
