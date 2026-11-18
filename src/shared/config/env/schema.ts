import { z } from 'zod';

/**
 * Server environment variables, validated at startup.
 * To add a variable, add a field here and a line with a comment to `.env.example`.
 */
export const envSchema = z.object({});

export type Env = z.infer<typeof envSchema>;
