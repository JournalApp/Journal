import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './db',
  dialect: 'sqlite',
  out: './db/migrations',
  // migrations: {
  //   schema: './db/schema.ts',
  // },
});
