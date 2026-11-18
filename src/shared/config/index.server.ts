import 'server-only';

import { parseEnv } from './env/parse-env';
import { envSchema } from './env/schema';

// The only place in the app that reads process.env.
export const env = parseEnv(envSchema, process.env);
