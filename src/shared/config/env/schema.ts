import { z } from 'zod';

/**
 * Server environment variables, validated at startup.
 * To add a variable, add a field here and a line with a comment to `.env.example`.
 */
export const envSchema = z.object({
  // Folder for book files; a relative path is resolved from the project root.
  STORAGE_DIR: z.string().min(1).default('./storage'),
});

export type Env = z.infer<typeof envSchema>;
