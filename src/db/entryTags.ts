import { InferSelectModel, sql } from 'drizzle-orm';
import { foreignKey, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { tags } from './tags';

export const entryTags = sqliteTable(
  'entries_tags',
  {
    userId: text('user_id'),
    journalId: integer('journal_id').default(0),
    day: text('day'),
    tagId: text('tag_id'),
    orderNo: integer('order_no').default(0),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`),
    modifiedAt: text('modified_at')
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`)
      .$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
    revision: integer('revision'),
    syncStatus: text('sync_status').default('synced'),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.day, table.userId, table.journalId, table.tagId] }),
      fk: foreignKey({
        columns: [table.tagId],
        foreignColumns: [tags.id],
      })
        .onDelete('cascade')
        .onUpdate('no action'),
    };
  },
);

export type EntryTag = InferSelectModel<typeof entryTags>;

export const insertEntryTagSchema = createInsertSchema(entryTags);

export const selectEntryTagSchema = createSelectSchema(entryTags);
