import { z } from 'zod';

// One hostname label: letters, digits and inner hyphens.
const LABEL = '[a-z0-9]([a-z0-9-]*[a-z0-9])?';

// A hostname or a Next.js pattern, as `allowedDevOrigins` matches it: labels or `*` (one label),
// with `**` (one or more labels) only at the start. No scheme, path or port.
const devOriginPattern = new RegExp(`^(\\*\\*\\.)?((${LABEL}|\\*)\\.)*(${LABEL}|\\*)$`, 'i');

const devOrigin = z
  .string()
  .regex(
    devOriginPattern,
    'must be a hostname or pattern such as 192.168.1.20, without http:// or a port',
  )
  // A pattern made only of wildcards would open the dev server to any host.
  .refine((origin) => origin.split('.').some((label) => !label.startsWith('*')), {
    message: 'must contain at least one label that is not a wildcard',
  });

/**
 * Server environment variables, validated at startup.
 * To add a variable, add a field here and a line with a comment to `.env.example`.
 */
export const envSchema = z.object({
  // SQLite database file; a relative path is resolved from the project root.
  DATABASE_URL: z.string().startsWith('file:'),
  // Folder for book files; a relative path is resolved from the project root.
  STORAGE_DIR: z.string().min(1).default('./storage'),
  // Hostnames, besides localhost, allowed to open `next dev` (for example a phone on the local
  // network): a comma-separated list, empty by default. Used only by next.config.ts.
  DEV_ALLOWED_ORIGINS: z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin !== ''),
    )
    .pipe(z.array(devOrigin)),
});

export type Env = z.infer<typeof envSchema>;
