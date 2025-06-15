import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './drizzle/schema.ts', // path to your schema.ts file
  out: './drizzle/migrations', // path to your migrations
  dialect: 'postgresql',
  strict: true,
  verbose: true,
  dbCredentials: {
    url: process.env.POSTGRES_URL!,
  },
});
