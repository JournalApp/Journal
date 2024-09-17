import { foreignKey, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { users } from './users';

export const journalsCatalog = sqliteTable(
  'journals_catalog',
  {
    userId: text('user_id'),
    journalId: integer('journal_id').default(0),
    name: text('name').notNull().default('Default'),
    color: text('color'),
    iconName: text('icon_name'),
    iconUrl: text('icon_url'),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.userId, table.journalId] }),
      fk: foreignKey({ columns: [table.userId], foreignColumns: [users.id] })
        .onDelete('cascade')
        .onUpdate('no action'),
    };
  },
);

export const insertJournalsCatalogSchema = createInsertSchema(journalsCatalog);

export const selectJournalsCatalogSchema = createSelectSchema(journalsCatalog);
