import { sqliteTable, primaryKey, foreignKey, text } from 'drizzle-orm/sqlite-core';
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
