import { sql } from 'drizzle-orm';
import { sqliteTable, text, primaryKey, integer, foreignKey } from 'drizzle-orm/sqlite-core';
import { journalsCatalog } from './journals-catalog';
import { users } from './users'; // Adjust the import according to your project structure

// Define the Journals table
export const journals = sqliteTable(
  'journals',
  {
    userId: text('user_id').references(() => users.id, {
      onDelete: 'cascade',
      onUpdate: 'no action',
    }),
    day: text('day'),
    journalId: integer('journal_id').default(0),
    tagId: text('tag_id'),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`),
    modified_at: text('modified_at')
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`)
      .$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
    content: text('content'),
    revision: integer('revision').notNull().default(0),
    syncStatus: text('sync_status').default('synced'),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.userId, table.day, table.journalId, table.tagId] }),
      fk: foreignKey({
        columns: [table.userId, table.journalId],
        foreignColumns: [journalsCatalog.userId, journalsCatalog.journalId],
      })
        .onDelete('cascade')
        .onUpdate('no action'),
    };
  },
);
