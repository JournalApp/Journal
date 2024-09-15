import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const app = sqliteTable('app', {
  key: text('key').notNull().primaryKey(),
  value: text('value'),
});
