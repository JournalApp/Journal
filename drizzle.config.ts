import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db',
  dialect: 'sqlite',
  out: './src/db/migrations',
});
