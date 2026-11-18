// Safe to import anywhere, including Vitest and next.config.ts. Server code reads the values from
// `index.server.ts`.
export { parseEnv } from './env/parse-env';
export { envSchema, type Env } from './env/schema';
