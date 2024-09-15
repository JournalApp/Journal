import { blob, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  fullName: text('full_name'),
  secretKey: blob('secret_key'),
  subscription: text('subscription'),
});
