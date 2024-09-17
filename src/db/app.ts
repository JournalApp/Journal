import { primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const appTable = sqliteTable(
  'app',
  {
    key: text('key'),
    value: text('value'),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.key] }),
    };
  },
);

export const insertAppSchema = createInsertSchema(appTable);

export const selectAppSchema = createSelectSchema(appTable);
