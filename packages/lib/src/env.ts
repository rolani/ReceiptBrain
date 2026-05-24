import { z } from 'zod';

export class EnvValidationError extends Error {
  constructor(
    public readonly issues: { path: string; message: string }[],
  ) {
    super(
      `Invalid environment variables:\n${issues
        .map((i) => `  - ${i.path}: ${i.message}`)
        .join('\n')}`,
    );
    this.name = 'EnvValidationError';
  }
}

export function parseEnv<S extends z.ZodTypeAny>(schema: S, source: NodeJS.ProcessEnv = process.env): z.infer<S> {
  const result = schema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues.map((i) => ({
      path: i.path.join('.'),
      message: i.message,
    }));
    throw new EnvValidationError(issues);
  }
  return result.data;
}
