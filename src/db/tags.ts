import { sql } from 'drizzle-orm';
import { foreignKey, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { journalsCatalog } from './journals-catalog';

export const tags = sqliteTable(
  'tags',
  {
    id: text('id').unique(),
    userId: text('user_id'),
    journalId: integer('journal_id').default(0),
    name: text('name'),
    color: text('color'),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`),
    modifiedAt: text('modified_at')
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`)
      .$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
    revision: integer('revision').notNull().default(0),
    syncStatus: text('sync_status').default('synced'),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.userId, table.journalId] }),
      fk: foreignKey({
        columns: [table.userId, table.journalId],
        foreignColumns: [journalsCatalog.userId, journalsCatalog.journalId],
      })
        .onDelete('cascade')
        .onUpdate('no action'),
    };
  },
);

export const insertTagSchema = createInsertSchema(tags);

export const selectTagSchema = createSelectSchema(tags);
