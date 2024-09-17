import { app, safeStorage, ipcMain } from 'electron';
import Database from 'better-sqlite3';
import { eq, and, sql, ne, asc, desc, exists, count, gte } from 'drizzle-orm';
import { BetterSQLite3Database, drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import log from 'electron-log';
import { betaEndDate } from '../constants';
import { logger, isDev, isTesting } from '../utils';
import type { Entry, Tag, EntryTag, EntryTagProperty, Subscription } from '@/types';
import { EventEmitter } from 'events';
import { journals } from '@/db/journals';
import { entryTags } from '@/db/entryTags';
import { journalsCatalog } from '@/db/journals-catalog';
import { tags } from '@/db/tags';
import { appTable } from '@/db/app';
import { preferences } from '@/db/preferences';
import { users } from '@/db/users';
const sqliteEvents = new EventEmitter();

let database: BetterSQLite3Database;

const getDB = () => {
  if (!database) {
    const dbName = isTesting() ? 'cache-test.db' : isDev() ? 'cache-dev.db' : 'cache.db';
    const dbPath = app.getPath('userData') + '/' + dbName;
    try {
      const db = new Database(dbPath, { fileMustExist: true });
      database = drizzle(db);
      logger('Database already exists');
    } catch {
      logger('No database found, creating new');
      const db = new Database(dbPath);

      const database = drizzle(db);
      migrate(database, { migrationsFolder: 'db' });
      logger(`Running final schema for version`);
    }
  }
  return database;
};

//////////////////////////
// DB Initialization
//////////////////////////

try {
  logger('🏓 getDB & run migrations with triggers');
  getDB();
} catch (error) {
  logger(error);
  log.error(error);
}

type Options = Pick<Entry, 'sync_status' | 'day' | 'user_id'>;

const safelyHandleSyncStatus = (db: BetterSQLite3Database, options: Options) => {
  let syncStatus = options.sync_status;
  const entry = db
    .select({
      sync_status: journals.syncStatus,
    })
    .from(journals)
    .where(and(eq(journals.userId, options.user_id), eq(journals.day, options.day)))
    .prepare();

  // Prevent overriding 'pending_delete' sync_status with 'pending_insert'
  if (syncStatus == 'pending_insert') {
    const entryCache = entry.get();

    if (entryCache && entryCache.sync_status == 'pending_delete') {
      logger(`Changing sync_status to 'pending_update' because it's 'pending_delete'`);
      syncStatus = 'pending_update';
    }
  } else if (syncStatus == 'pending_update') {
    const entryCache = entry.get();

    if (entryCache && entryCache.sync_status == 'pending_insert') {
      logger(`Not changing sync_status to 'pending_update' because it's 'pending_insert'`);
      syncStatus = 'pending_insert';
    }
  }

  return syncStatus;
};
//////////////////////////
// Entries
//////////////////////////

ipcMain.handle('cache-add-or-update-entry', async (_event, entry: Entry) => {
  logger('cache-add-or-update-entry');
  try {
    const db = getDB();
    let { sync_status } = entry;
    const { user_id, day, created_at, modified_at, content, revision } = entry;

    sync_status = safelyHandleSyncStatus(db, entry);

    const stmt = db
      .insert(journals)
      .values({
        user_id,
        day,
        created_at,
        modified_at,
        content,
        revision,
        sync_status,
      })
      .onConflictDoUpdate({
        target: [journals.userId, journals.journalId, journals.day],
        set: {
          content: sql.raw(`excluded.${journals.content}`),
          createdAt: sql.raw(`excluded.${journals.createdAt}`),
          modifiedAt: sql.raw(`excluded.${journals.modifiedAt}`),
          revision: sql.raw(`excluded.${journals.revision}`),
          syncStatus: sql.raw(`excluded.${journals.syncStatus}`),
        },
      })
      .prepare();

    return stmt.run({ user_id, day, created_at, modified_at, content, revision, sync_status });
  } catch (error) {
    logger(`cache-add-or-update-entry error`);
    logger(error);
    return error;
  }
});

ipcMain.handle('cache-delete-entry', async (_event, query) => {
  logger('cache-delete-entry');
  try {
    const db = getDB();
    const { user_id, day } = query;
    const stmt = await db
      .delete(journals)
      .where(and(eq(journals.userId, user_id), eq(journals.day, day)))
      .prepare();

    const result = stmt.run({ user_id, day });

    db.delete(entryTags)
      .where(and(eq(entryTags.userId, user_id), eq(entryTags.day, day)))
      .prepare()
      .run({ user_id, day });

    return result;
  } catch (error) {
    logger(`cache-delete-entry error`);
    logger(error);
    return error;
  }
});

ipcMain.handle('cache-update-entry', async (_event, set, where) => {
  logger('cache-update-entry');
  try {
    const db = getDB();
    const { user_id, day } = where;
    const { modified_at, content } = set;

    const stmt = db
      .update(journals)
      .set({
        modified_at,
        content,
      })
      .where(and(eq(journals.userId, user_id), eq(journals.day, day)))
      .prepare();

    return stmt.run({ user_id, day, modified_at, content });
  } catch (error) {
    logger(`cache-update-entry error`);
    logger(error);
    return error;
  }
});

ipcMain.handle('cache-update-entry-property', async (_event, set: any, where) => {
  logger('cache-update-entry-property');
  try {
    const db = getDB();
    let { sync_status } = set;
    const { user_id, day } = where;

    sync_status = safelyHandleSyncStatus(db, { sync_status, day, user_id });

    const stmt = db
      .update(journals)
      .set({ ...set, sync_status })
      .where(and(eq(journals.userId, user_id), eq(journals.day, day)))
      .prepare();

    return stmt.run({ user_id, day, ...set });
  } catch (error) {
    logger(`cache-update-entry-property error`);
    logger(error);
    return error;
  }
});

ipcMain.handle('cache-get-days', async (_event, user_id) => {
  logger('cache-get-days');
  try {
    const db = getDB();
    const stmt = db
      .select({
        day: journals.day,
        revision: journals.revision,
      })
      .from(journals)
      .where(and(eq(journals.userId, user_id), ne(journals.syncStatus, 'pending_delete')))
      .orderBy(asc(journals.day))
      .prepare();

    const result = stmt.all({ user_id }) as Entry[];
    return result;
  } catch (error) {
    logger(`cache-get-days error`);
    logger(error);
    return error;
  }
});

ipcMain.handle('cache-get-entries', async (_event, user_id) => {
  logger('cache-get-entries');
  try {
    const db = getDB();

    const stmt = db
      .select()
      .from(journals)
      .where(and(eq(journals.userId, user_id), ne(journals.syncStatus, 'pending_delete')));

    const result = stmt.all({ user_id });

    result.forEach((element) => {
      element.content = JSON.parse(element.content);
    });
    return result;
  } catch (error) {
    logger(`cache-get-entries error`);
    logger(error);
    return error;
  }
});

ipcMain.handle('cache-get-pending-delete-entries', async (_event, user_id) => {
  logger('cache-get-pending-delete-entries');
  try {
    const db = getDB();
    const stmt = db
      .select()
      .from(journals)
      .where(and(eq(journals.userId, user_id), eq(journals.syncStatus, 'pending_delete')))
      .prepare();

    const result = stmt.all({ user_id });
    logger(`Pending delete entries: ${result.length}`);
    return result;
  } catch (error) {
    logger(`cache-get-pending-delete-entries error`);
    logger(error);
    return error;
  }
});

ipcMain.handle('cache-get-pending-insert-entries', async (_event, user_id) => {
  logger('cache-get-pending-insert-entries');
  try {
    const db = getDB();

    const stmt = db
      .select()
      .from(journals)
      .where(and(eq(journals.userId, user_id), eq(journals.syncStatus, 'pending_insert')))
      .prepare();

    const result = stmt.all({ user_id });
    logger(`Pending insert entries: ${result.length}`);
    return result;
  } catch (error) {
    logger(`cache-get-pending-insert-entries error`);
    logger(error);
    return error;
  }
});

ipcMain.handle('cache-get-pending-update-entries', async (_event, user_id) => {
  logger('cache-get-pending-update-entries');
  try {
    const db = getDB();

    const stmt = db
      .select()
      .from(journals)
      .where(and(eq(journals.userId, user_id), eq(journals.syncStatus, 'pending_update')))
      .prepare();

    const result = stmt.all({ user_id });

    logger(`Pending update entries: ${result.length}`);
    return result;
  } catch (error) {
    logger(`cache-get-pending-update-entries error`);
    logger(error);
    return error;
  }
});

ipcMain.handle('cache-delete-all', async (_event, user_id) => {
  logger('cache-delete-all');
  try {
    const db = getDB();

    await db.delete(journals).where(eq(journals.userId, user_id));
    await db.delete(journalsCatalog).where(eq(journalsCatalog.userId, user_id));
    await db.delete(entryTags).where(eq(entryTags.userId, user_id));
  } catch (error) {
    logger(`cache-delete-all error`);
    logger(error);
    return error;
  }
});

ipcMain.handle('cache-does-entry-exist', async (_event: any, user_id: string, day: string) => {
  logger('cache-does-entry-exist');
  try {
    const db = getDB();
    const query = db
      .select()
      .from(journals)
      .where(and(eq(journals.userId, user_id), eq(journals.day, day)))
      .limit(1);

    const result = db.select().from(journals).where(exists(query));

    const entryExists = !!Object.values(result)[0];
    logger(`Entry ${day} exists = ${entryExists}`);
    return entryExists;
  } catch (error) {
    logger(`cache-does-entry-exist error`);
    logger(error);
    return error;
  }
});

ipcMain.handle('cache-get-entries-count', async (_event, user_id) => {
  logger('cache-get-entries-count');
  try {
    const db = getDB();

    const result = db
      .select({ value: count() })
      .from(journals)
      .where(
        and(
          eq(journals.userId, user_id),
          ne(journals.syncStatus, 'pending_delete'),
          gte(journals.createdAt, betaEndDate),
        ),
      )
      .prepare()
      .get({ user_id, betaEndDate });

    return Object.values(result)[0] ?? 0;
  } catch (error) {
    logger(`cache-get-entries-count error`);
    logger(error);
    return error;
  }
});

//////////////////////////
// Tags
//////////////////////////

ipcMain.handle('cache-add-or-update-tag', async (_event, val: Tag) => {
  logger('cache-add-or-update-tag');
  try {
    const db = getDB();
    const { id, user_id, name, color, created_at, modified_at, revision, sync_status } = val;
    const stmt = db
      .insert(tags)
      .values({
        id,
        user_id,
        name,
        color,
        created_at,
        modified_at,
        revision,
        sync_status,
      })
      .onConflictDoUpdate({
        target: [tags.id],
        set: {
          name: sql.raw(`excluded.${tags.name}`),
          color: sql.raw(`excluded.${tags.color}`),
          modifiedAt: sql.raw(`excluded.${tags.modifiedAt}`),
          revision: sql.raw(`excluded.${tags.revision}`),
          syncStatus: sql.raw(`excluded.${tags.syncStatus}`),
        },
      })
      .prepare();

    return stmt.run({ id, user_id, name, color, created_at, modified_at, revision, sync_status });
  } catch (error) {
    logger(`cache-add-or-update-tag error`);
    logger(error);
    return error;
  }
});

ipcMain.handle('cache-update-tag-property', async (_event, set, tag_id) => {
  logger('cache-update-tag-property');
  try {
    const db = getDB();

    // Prevent overring sync_status of 'pening_insert' with 'pending_update'
    if (set.sync_status == 'pending_update') {
      const tag = db
        .select({
          sync_status: tags.syncStatus,
        })
        .from(tags)
        .where(eq(tags.id, tag_id))
        .prepare()
        .get({ tag_id });

      if (tag.sync_status == 'pending_insert') {
        logger(`Not changing sync_status to 'pending_update' because it's 'pending_insert'`);
        set.sync_status = 'pending_insert';
      }
    }

    const stmt = db.update(tags).set(set).where(eq(tags.id, tag_id)).prepare();

    return stmt.run({ tag_id, ...set });
  } catch (error) {
    logger(`cache-update-tag-property error`);
    logger(error);
    return error;
  }
});

ipcMain.handle('cache-get-tags', async (_event, user_id) => {
  logger('cache-get-tags');
  try {
    const db = getDB();

    const stmt = db
      .select()
      .from(tags)
      .where(and(eq(tags.userId, user_id), ne(tags.syncStatus, 'pending_delete')))
      .orderBy(desc(tags.modifiedAt))
      .prepare();

    const result = stmt.all({ user_id });
    return result;
  } catch (error) {
    logger(`cache-get-tags error`);
    logger(error);
    return error;
  }
});

ipcMain.handle('cache-get-days-with-tag', async (_event, tag_id) => {
  logger('cache-get-days-with-tag');
  try {
    const db = getDB();

    const stmt = db
      .select({
        day: entryTags.day,
      })
      .from(entryTags)
      .where(eq(entryTags.tagId, tag_id))
      .prepare();

    const result = stmt.all({ tag_id });
    const daysArray: string[] = [];
    for (const [, value] of Object.entries(result)) {
      daysArray.push(value.day);
    }
    return daysArray;
  } catch (error) {
    logger(`cache-get-days-with-tag error`);
    logger(error);
    return error;
  }
});

ipcMain.handle('cache-get-tag', async (_event, id) => {
  logger('cache-get-tag');
  try {
    const db = getDB();

    return db.select().from(tags).where(eq(tags.id, id)).prepare().get({ id });
  } catch (error) {
    logger(`cache-get-tag error`);
    logger(error);
    return error;
  }
});

ipcMain.handle('cache-get-pending-delete-tags', async (_event, user_id) => {
  logger('cache-get-pending-delete-tags');
  try {
    const db = getDB();

    const stmt = db
      .select()
      .from(tags)
      .where(and(eq(tags.userId, user_id), eq(tags.syncStatus, 'pending_delete')))
      .prepare();

    const result = stmt.all({ user_id });
    logger(`Pending delete tags: ${result.length}`);
    return result;
  } catch (error) {
    logger(`cache-get-pending-delete-tags error`);
    logger(error);
    return error;
  }
});

ipcMain.handle('cache-get-pending-update-tags', async (_event, user_id) => {
  logger('cache-get-pending-update-tags');
  try {
    const db = getDB();

    const stmt = db
      .select()
      .from(tags)
      .where(and(eq(tags.userId, user_id), eq(tags.syncStatus, 'pending_update')))
      .prepare();

    const result = stmt.all({ user_id });
    logger(`Pending update tags: ${result.length}`);
    return result;
  } catch (error) {
    logger(`cache-get-pending-update-tags error`);
    logger(error);
    return error;
  }
});

ipcMain.handle('cache-get-pending-insert-tags', async (_event, user_id) => {
  logger('cache-get-pending-insert-tags');
  try {
    const db = getDB();

    const stmt = db
      .select()
      .from(tags)
      .where(and(eq(tags.userId, user_id), eq(tags.syncStatus, 'pending_insert')))
      .prepare();

    const result = stmt.all({ user_id });
    logger(`Pending insert tags: ${result.length}`);
    return result;
  } catch (error) {
    logger(`cache-get-pending-insert-tags error`);
    logger(error);
    return error;
  }
});

ipcMain.handle('cache-delete-tag', async (_event, tag_id) => {
  logger('cache-delete-tag');
  try {
    const db = getDB();

    const stmt = db.delete(tags).where(eq(tags.id, tag_id)).prepare();

    const result = stmt.run({ tag_id });
    return result;
  } catch (error) {
    logger(`cache-delete-tag error`);
    logger(error);
    return error;
  }
});

//////////////////////////
// Entry tags
//////////////////////////

ipcMain.handle('cache-add-or-update-entry-tag', async (_event, entryTag: EntryTag) => {
  logger('cache-add-or-update-entry-tag');
  try {
    const db = getDB();
    const { user_id, day, tag_id, order_no, created_at, modified_at, revision, sync_status } =
      entryTag;

    const stmt = db
      .insert(entryTags)
      .values({
        user_id,
        day,
        tag_id,
        order_no,
        created_at,
        modified_at,
        revision,
        sync_status,
      })
      .onConflictDoUpdate({
        target: [entryTags.userId, entryTags.day, entryTags.tagId, entryTags.journalId],
        set: {
          order_no: sql.raw(`excluded.${entryTags.orderNo}`),
          modifiedAt: sql.raw(`excluded.${entryTags.modifiedAt}`),
          revision: sql.raw(`excluded.${entryTags.revision}`),
          syncStatus: sql.raw(`excluded.${entryTags.syncStatus}`),
        },
      })
      .prepare();

    return stmt.run({
      user_id,
      day,
      tag_id,
      order_no,
      created_at,
      modified_at,
      revision,
      sync_status,
    });
  } catch (error) {
    logger(`cache-add-or-update-entry-tag error`);
    logger(error);
    return error;
  }
});

ipcMain.handle('cache-get-pending-insert-entry-tags', async (_event, user_id) => {
  logger('cache-get-pending-insert-entry-tags');
  try {
    const db = getDB();

    const stmt = db
      .select()
      .from(entryTags)
      .where(and(eq(entryTags.userId, user_id), eq(entryTags.syncStatus, 'pending_insert')))
      .prepare();

    const result = stmt.all({ user_id });
    logger(`Pending insert entry tags: ${result.length}`);
    return result;
  } catch (error) {
    logger(`cache-get-pending-insert-entry-tags error`);
    logger(error);
    return error;
  }
});

ipcMain.handle(
  'cache-update-entry-tag-property',
  async (_event: any, set: EntryTagProperty, user_id: string, day: string, tag_id: string) => {
    logger('cache-update-entry-tag-property');
    try {
      const db = getDB();

      // Prevent overring sync_status of 'pening_insert' with 'pending_update'
      if (set.sync_status == 'pending_update') {
        const entryTag = db
          .select({ sync_status: entryTags.syncStatus })
          .from(entryTags)
          .where(
            and(eq(entryTags.userId, user_id), eq(entryTags.day, day), eq(entryTags.tagId, tag_id)),
          )
          .prepare()
          .get({ user_id, day, tag_id }) as EntryTag;

        if (entryTag.sync_status == 'pending_insert') {
          logger(`Not changing sync_status to 'pending_update' because it's 'pending_insert'`);
          set.sync_status = 'pending_insert';
        }
      }

      const stmt = db
        .update(entryTags)
        .set(set)
        .where(
          and(eq(entryTags.userId, user_id), eq(entryTags.day, day), eq(entryTags.tagId, tag_id)),
        )
        .prepare();

      return stmt.run({ user_id, day, tag_id, ...set });
    } catch (error) {
      logger(`cache-update-entry-tag-property error`);
      logger(error);
      return error;
    }
  },
);

ipcMain.handle('cache-get-pending-delete-entry-tags', async (event, user_id) => {
  logger('cache-get-pending-delete-entry-tags');
  try {
    const db = getDB();

    const stmt = db
      .select()
      .from(entryTags)
      .where(and(eq(entryTags.userId, user_id), eq(entryTags.syncStatus, 'pending_delete')))
      .prepare();

    const result = stmt.all({ user_id });
    logger(`Pending delete entry tags: ${result.length}`);
    return result;
  } catch (error) {
    logger(`cache-get-pending-delete-entry-tags error`);
    logger(error);
    return error;
  }
});

ipcMain.handle('cache-delete-entry-tag', async (event, user_id, tag_id, day) => {
  logger('cache-delete-entry-tag');
  try {
    const db = getDB();

    const stmt = db
      .delete(entryTags)
      .where(
        and(eq(entryTags.userId, user_id), eq(entryTags.tagId, tag_id), eq(entryTags.day, day)),
      )
      .prepare();

    const result = stmt.run({ user_id, tag_id, day });
    return result;
  } catch (error) {
    logger(`cache-delete-entry-tag error`);
    logger(error);
    return error;
  }
});

ipcMain.handle('cache-get-pending-update-entry-tags', async (event, user_id) => {
  logger('cache-get-pending-update-entry-tags');
  try {
    const db = getDB();

    const stmt = db
      .select()
      .from(entryTags)
      .where(and(eq(entryTags.userId, user_id), eq(entryTags.syncStatus, 'pending_update')))
      .prepare();

    const result = stmt.all({ user_id });
    logger(`Pending update entry tags: ${result.length}`);
    return result;
  } catch (error) {
    logger(`cache-get-pending-update-entry-tags error`);
    logger(error);
    return error;
  }
});

ipcMain.handle('cache-get-entry-tags', async (event, user_id) => {
  logger('cache-get-entry-tags');
  try {
    const db = getDB();

    const stmt = db
      .select()
      .from(entryTags)
      .where(and(eq(entryTags.userId, user_id), ne(entryTags.syncStatus, 'pending_delete')))
      .prepare();

    const result = stmt.all({ user_id });
    return result;
  } catch (error) {
    logger(`cache-get-entry-tags error`);
    logger(error);
    return error;
  }
});

ipcMain.handle('cache-get-entry-tags-on-day', async (event, user_id, day) => {
  logger('cache-get-entry-tags-on-day');
  try {
    const db = getDB();

    const stmt = db
      .select()
      .from(entryTags)
      .where(
        and(
          eq(entryTags.userId, user_id),
          eq(entryTags.day, day),
          ne(entryTags.syncStatus, 'pending_delete'),
        ),
      )
      .prepare();

    const result = stmt.all({ user_id, day });
    return result;
  } catch (error) {
    logger(`cache-get-entry-tags-on-day error`);
    logger(error);
    return error;
  }
});

//////////////////////////
// Preferences
//////////////////////////

ipcMain.on('preferences-get-all', (event, user_id?) => {
  interface prefMap {
    [key: string]: string;
  }

  logger('preferences-get-all');
  try {
    const db = getDB();

    const stmt1 = db
      .select({ value: appTable.value })
      .from(appTable)
      .where(eq(appTable.key, 'lastUser'))
      .prepare();

    const lastUser = stmt1.get({ key: 'lastUser' }) as { value: string };
    if (lastUser) {
      const stmt2 = db.select().from(preferences).where(eq(preferences.userId, user_id)).prepare();

      const prefs = stmt2.all({ user_id: user_id || lastUser.value }) as {
        item: string;
        value: string;
      }[];
      if (prefs.length) {
        const prettyPrefs = {} as prefMap;
        for (const element of prefs) {
          prettyPrefs[element.item] = element.value;
        }
        event.returnValue = prettyPrefs;
      } else {
        event.returnValue = undefined;
      }
    } else {
      event.returnValue = undefined;
    }
  } catch (error) {
    logger(`preferences-get-all error`);
    logger(error);
    event.returnValue = error;
  }
});

ipcMain.handle('preferences-set', async (event, user_id, set) => {
  logger('preferences-set');
  try {
    const db = getDB();
    const item = Object.keys(set)[0];
    const value = Object.values(set)[0];

    const stmt = db
      .insert(preferences)
      .values({
        user_id,
        item,
        value,
      })
      .onConflictDoUpdate({
        target: [preferences.userId, preferences.item],
        set: {
          value: sql.raw(`excluded.${preferences.value}`),
        },
      })
      .prepare();

    return stmt.run({ user_id, item, value });
  } catch (error) {
    logger(`preferences-set error`);
    logger(error);
    return error;
  }
});

ipcMain.handle('preferences-delete-all', async (event, user_id) => {
  logger('preferences-delete-all');
  try {
    const db = getDB();

    const stmt = db.delete(preferences).where(eq(preferences.userId, user_id)).prepare();

    const result = stmt.run({ user_id });
    return result;
  } catch (error) {
    logger(`preferences-delete-all error`);
    logger(error);
    return error;
  }
});

//////////////////////////
// App (sync api)
//////////////////////////

ipcMain.on('app-get-key', (event, key) => {
  logger('app-get-key');
  try {
    const db = getDB();

    const stmt = db
      .select({ value: appTable.value })
      .from(appTable)
      .where(eq(appTable.key, key))
      .prepare();

    const res = stmt.get({ key }) as { value: string };
    event.returnValue = res.value;
  } catch (error) {
    logger(`app-get-key error`);
    logger(error);
    event.returnValue = error;
  }
});

ipcMain.handle('app-set-key', async (event, set) => {
  logger('app-set-key');
  try {
    const db = getDB();
    const key = Object.keys(set)[0];
    const value = Object.values(set)[0];

    const stmt = db
      .insert(appTable)
      .values({
        key,
        value,
      })
      .onConflictDoUpdate({
        target: [appTable.key],
        set: {
          value: sql.raw(`excluded.${appTable.value}`),
        },
      })
      .prepare();

    stmt.run({ key, value });
  } catch (error) {
    logger(`app-set-key error`);
    logger(error);
  }
});

//////////////////////////
// User
//////////////////////////

ipcMain.handle('cache-add-user', async (event, id) => {
  logger('cache-add-user');
  try {
    const db = getDB();

    const stmt = db
      .insert(users)
      .values({
        id,
      })
      .onConflictDoNothing()
      .prepare();

    stmt.run({ id });

    // Create default journal_catalog for the user
    const create_journal = db
      .insert(journalsCatalog)
      .values({
        user_id: id,
      })
      .onConflictDoNothing()
      .prepare();

    return create_journal.run({ id });
  } catch (error) {
    logger(`cache-add-user error`);
    logger(error);
    return error;
  }
});

ipcMain.handle('user-save-secret-key', async (event, user_id, secretKey) => {
  logger('user-save-secret-key');
  try {
    const encryptedSecreyKey = safeStorage.encryptString(secretKey);
    const db = getDB();

    const stmt = db
      .update(users)
      .set({ secret_key: encryptedSecreyKey })
      .where(eq(users.id, user_id))
      .prepare();

    stmt.run({ encryptedSecreyKey, user_id });
  } catch (error) {
    logger(`user-save-secret-key error`);
    logger(error);
  }
});

ipcMain.handle('app-get-secret-key', async (event, user_id) => {
  logger('app-get-secret-key');
  try {
    const db = getDB();

    const stmt = db
      .select({ secret_key: users.secretKey })
      .from(users)
      .where(eq(users.id, user_id));

    const res = stmt.get({ user_id }) as { secret_key: Buffer };
    if (res?.secret_key) {
      return safeStorage.decryptString(res.secret_key);
    } else {
      return null;
    }
  } catch (error) {
    logger(`app-get-secret-key error`);
    logger(error);
    return null;
  }
});

ipcMain.handle(
  'user-save-subscription',
  async (event, user_id: string, subscription: Subscription) => {
    logger('user-save-subscription');
    try {
      const db = getDB();

      const stmt = db
        .insert(users)
        .values({
          id: user_id,
          subscription: JSON.stringify(subscription),
        })
        .onConflictDoUpdate({
          target: [users.id],
          set: {
            subscription: sql.raw(`excluded.${users.subscription}`),
          },
        })
        .prepare();

      stmt.run({ id: user_id, subscription: JSON.stringify(subscription) });
    } catch (error) {
      logger(`user-save-subscription error`);
      logger(error);
    }
  },
);

ipcMain.on('user-get-subscription', (event, user_id: string) => {
  logger('user-get-subscription');
  try {
    const db = getDB();

    const stmt = db
      .select({ subscription: users.subscription })
      .from(users)
      .where(eq(users.id, user_id));
    const res = stmt.get({ user_id }) as { subscription: string };
    if (res?.subscription) {
      event.returnValue = JSON.parse(res.subscription);
    } else {
      event.returnValue = null;
    }
  } catch (error) {
    logger(`user-get-subscription error`);
    logger(error);
    event.returnValue = null;
  }
});

//////////////////////////
// Functions
//////////////////////////

const getAppBounds = (defaultWidth: number, defaultHeight: number) => {
  try {
    const db = getDB();

    const stmt = db
      .select({ value: appTable.value })
      .from(appTable)
      .where(eq(appTable.key, 'windowBounds'))
      .prepare();
    const res = stmt.get() as { value: string };
    if (res?.value) {
      return JSON.parse(res.value);
    } else {
      return { width: defaultWidth, height: defaultHeight };
    }
  } catch (error) {
    logger(`getAppBounds error`);
    logger(error);
    return { width: defaultWidth, height: defaultHeight };
  }
};

const setAppBounds = (value: Electron.Rectangle) => {
  try {
    const db = getDB();

    console.log('setAppBounds', value);
    const stmt = db
      .insert(appTable)
      .values({ key: 'windowBounds', value: JSON.stringify(value) })
      .onConflictDoUpdate({
        target: [appTable.key],
        set: {
          value: sql.raw(`excluded.${appTable.value}`),
        },
      })
      .prepare();

    stmt.run({ value: JSON.stringify(value) });
  } catch (error) {
    logger(`setAppBounds error`);
    logger(error);
  }
};

const getLastUser = () => {
  logger('getLastUser');
  try {
    const db = getDB();

    const stmt = db
      .select({ value: appTable.value })
      .from(appTable)
      .where(eq(appTable.key, 'lastUser'));

    const lastUser = stmt.get({ key: 'lastUser' }) as { value: string };
    return lastUser?.value ?? null;
  } catch (error) {
    logger(`getLastUser error`);
    logger(error);
    return null;
  }
};

export { getLastUser, getAppBounds, setAppBounds, sqliteEvents };
