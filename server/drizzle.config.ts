import type { Config } from 'drizzle-kit';
import { env } from './env';

export default {
  schema: '../shared/schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.dbUrl,
  },
  verbose: true,
  strict: true,
} satisfies Config;