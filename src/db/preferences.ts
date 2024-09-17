import { sqliteTable, primaryKey, foreignKey, text } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { users } from './users';

export const preferences = sqliteTable(
  'preferences',
  {
    userId: text('user_id'),
    item: text('item'),
    value: text('value'),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.userId, table.item] }),
      fk: foreignKey({ columns: [table.userId], foreignColumns: [users.id] })
        .onDelete('cascade')
        .onUpdate('no action'),
    };
  },
);

export const insertPreferenceSchema = createInsertSchema(preferences);

export const selectPreferenceSchema = createSelectSchema(preferences);
