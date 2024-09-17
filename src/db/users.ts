import { primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const users = sqliteTable(
  'users',
  {
    id: text('id'),
    fullName: text('full_name'),
    secretKey: text('secret_key', { mode: 'json' }),
    subscription: text('subscription'),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id] }),
    };
  },
);

export const insertUserSchema = createInsertSchema(users);

export const selectUserSchema = createSelectSchema(users);
