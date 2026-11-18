import type { z } from 'zod';

/**
 * Validates environment variables against a schema and returns them typed.
 * Throws one error that names every invalid variable and the reason. Values are never included,
 * so secrets do not reach the logs.
 */
export function parseEnv<Schema extends z.ZodType>(
  schema: Schema,
  source: Record<string, string | undefined>,
): z.infer<Schema> {
  const result = schema.safeParse(source);

  if (!result.success) {
    const lines = result.error.issues.map(
      (issue) => `- ${issue.path.join('.') || '(root)'}: ${issue.message}`,
    );
    throw new Error(`Invalid environment variables:\n${lines.join('\n')}`);
  }

  return result.data;
}
