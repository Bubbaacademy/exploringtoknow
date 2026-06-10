import { z } from 'zod';

/**
 * Central environment contract. Phase 0 only hard-requires the three vars the
 * app needs to boot; the rest are optional until their phase consumes them.
 */
const schema = z.object({
  NODE_ENV: z.string().default('development'),
  DATABASE_URL: z.string().min(1),
  PAYLOAD_SECRET: z.string().min(1),
  AUTH_SECRET: z.string().min(1),
  // optional / later phases
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  WORKER_CRON_DAILY: z.string().default('0 6 * * *'),
});

export type Env = z.infer<typeof schema>;
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  return schema.parse(source);
}
