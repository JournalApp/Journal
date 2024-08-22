import { app, safeStorage, ipcMain, dialog } from 'electron';
import Database from 'better-sqlite3';
import type BetterSqlite3 from 'better-sqlite3';
import log from 'electron-log';
import schema_1 from '../sql/schema.1.sqlite.sql';
import schema_2 from '../sql/schema.2.sqlite.sql';
import migration_0to1 from '../sql/migration.0-to-1.sql';
import migration_1to2 from '../sql/migration.1-to-2.sql';
import { betaEndDate } from '../constants';
import { logger, isDev, isTesting } from '../utils';
import type { Entry, Tag, EntryTag, EntryTagProperty, Subscription } from '@/types';
import { EventEmitter } from 'events';
const sqliteEvents = new EventEmitter();

let database: BetterSqlite3.Database;

const getDB = () => {
  if (!database) {
    const dbName = isTesting() ? 'cache-test.db' : isDev() ? 'cache-dev.db' : 'cache.db';
    const dbPath = app.getPath('userData') + '/' + dbName;
    try {
      database = new Database(dbPath, { fileMustExist: true });
      logger('Database already exists');
    } catch {
      logger('No database found, creating new');
      database = new Database(dbPath);
      // Run Final Schema, no migrations needed
      // TODO make it automatic
      const appVersion = app.getVersion() as keyof typeof schemaVersions;
      const desiredSchemaVersion = schemaVersions[appVersion];
      const migration = migrations.find((m) => m.finalVersion == desiredSchemaVersion);
      logger(`Running final schema for version ${migration.finalVersion}`);
      database.exec(migration.sqlFinal);
      database.pragma(`user_version = ${migration.finalVersion}`);
    }
  }
  return database;
};

//////////////////////////
// Migrations
//////////////////////////

const migrations = [
  { name: 'migration.0-to-1.sql', sql: migration_0to1, sqlFinal: schema_1, finalVersion: 1 },
  { name: 'migration.1-to-2.sql', sql: migration_1to2, sqlFinal: schema_2, finalVersion: 2 },
];

const schemaVersions = {
  '1.0.0-beta.1': 0,
  '1.0.0-beta.2': 0,
  '1.0.0-beta.3': 0,
  '1.0.0-beta.4': 1,
  '1.0.0-beta.5': 1,
  '1.0.0-beta.6': 2,
  '1.0.0': 2,
  '1.0.1': 2,
  '1.0.2': 2,
  '1.0.3': 2,
  '1.0.4': 2,
  '1.0.5': 2,
};

const runMigrations = () => {
  const db = getDB();

  // Run migrations:
  const appVersion = app.getVersion() as keyof typeof schemaVersions;
  const currentSchemaVersion = db.pragma('user_version', { simple: true });
  const desiredSchemaVersion = schemaVersions[appVersion];

  if (currentSchemaVersion > desiredSchemaVersion) {
    dialog.showMessageBoxSync({
      message:
        "Can't run this version as newer versions was used before. Download latest version from www.journal.do",
      title: 'Version outdated',
      type: 'warning',
    });
    app.quit();
  }

  const migrationQueue = migrations.filter(
    (m, i) => i >= currentSchemaVersion && i < desiredSchemaVersion,
  );

  if (migrationQueue.length == 0) {
    logger(`No migrations to run. Current schema version is ${currentSchemaVersion}`);
  }

  migrationQueue.forEach((migration) => {
    logger(`Running ${migration.name}`);
    db.exec(migration.sql);
    logger(`Setting pragma user_version = ${migration.finalVersion}`);
    db.pragma(`user_version = ${migration.finalVersion}`);
  });
};

//////////////////////////
// Triggers
//////////////////////////

const initRemoveTriggers = () => {
  const db = getDB();
  db.prepare('DROP TRIGGER IF EXISTS entry_updated;').run();
  db.prepare('DROP TRIGGER IF EXISTS entry_inserted;').run();
  db.prepare('DROP TRIGGER IF EXISTS tag_updated;').run();
  db.prepare('DROP TRIGGER IF EXISTS tag_inserted;').run();
  db.prepare('DROP TRIGGER IF EXISTS entry_tag_inserted;').run();
  db.prepare('DROP TRIGGER IF EXISTS entry_tag_updated;').run();
};

const addTriggers = () => {
  const db = getDB();

  // 1. Entries
  db.function('emitEntryEvent', () => {
    sqliteEvents.emit('sqlite-entry-event');
  });
  // Entry updated
  db.prepare(
    "CREATE TRIGGER entry_updated AFTER UPDATE ON journals WHEN NEW.sync_status = 'pending_update' or NEW.sync_status = 'pending_delete' BEGIN SELECT emitEntryEvent(); END",
  ).run();

  // Entry inserted
  db.prepare(
    "CREATE TRIGGER entry_inserted AFTER INSERT ON journals WHEN NEW.sync_status = 'pending_insert' BEGIN SELECT emitEntryEvent(); END",
  ).run();

  // 2. Tags & EntryTags
  db.function('emitTagEvent', () => {
    sqliteEvents.emit('sqlite-tag-event');
  });

  // Tag updated
  db.prepare(
    "CREATE TRIGGER tag_updated AFTER UPDATE ON tags WHEN NEW.sync_status = 'pending_update' or NEW.sync_status = 'pending_delete' BEGIN SELECT emitTagEvent(); END",
  ).run();

  // Tag inserted
  db.prepare(
    "CREATE TRIGGER tag_inserted AFTER INSERT ON tags WHEN NEW.sync_status = 'pending_insert' BEGIN SELECT emitTagEvent(); END",
  ).run();

  // Entry tag inserted
  db.prepare(
    "CREATE TRIGGER entry_tag_inserted AFTER INSERT ON entries_tags WHEN NEW.sync_status = 'pending_insert' BEGIN SELECT emitTagEvent(); END",
  ).run();

  // Entry tag updated
  db.prepare(
    "CREATE TRIGGER entry_tag_updated AFTER UPDATE ON entries_tags WHEN NEW.sync_status = 'pending_update' or NEW.sync_status = 'pending_delete' BEGIN SELECT emitTagEvent(); END",
  ).run();
};

//////////////////////////
// DB Initlialization
//////////////////////////

try {
  logger('🏓 getDB');
  getDB();

  logger('🏓 initRemoveTriggers');
  initRemoveTriggers();

  logger('🏓 runMigrations');
  runMigrations();

  logger('🏓 addTriggers');
  addTriggers();
} catch (error) {
  logger(error);
  log.error(error);
}

//////////////////////////
// Entries
//////////////////////////

ipcMain.handle('cache-add-or-update-entry', async (_event, entry: Entry) => {
  logger('cache-add-or-update-entry');
  try {
    const db = getDB();
    let { sync_status } = entry;
    const { user_id, day, created_at, modified_at, content, revision } = entry;

    // Prevent overriding 'pending_delete' sync_status with 'pending_insert'
    if (sync_status == 'pending_insert') {
      const entryCache = db
        .prepare(`SELECT sync_status FROM journals WHERE day = @day and user_id = @user_id`)
        .get({ user_id, day }) as Entry;
      if (entryCache && entryCache.sync_status == 'pending_delete') {
        logger(`Changing sync_status to 'pending_update' because it's 'pending_delete'`);
        sync_status = 'pending_update';
      }
    }

    const stmt = db.prepare(
      `INSERT INTO journals (user_id, day, created_at, modified_at, content, revision, sync_status) VALUES (@user_id, @day, @created_at, @modified_at, @content, @revision, @sync_status)
      ON CONFLICT(user_id, journal_id, day) DO UPDATE SET content = excluded.content, created_at = excluded.created_at, modified_at = excluded.modified_at, revision = excluded.revision, sync_status = excluded.sync_status`,
    );
    return stmt.run({ user_id, day, created_at, modified_at, content, revision, sync_status });
  } catch (error) {
    logger(`error`);
    logger(error);
    return error;
  }
});

ipcMain.handle('cache-delete-entry', async (_event, query) => {
  logger('cache-delete-entry');
  try {
    const db = getDB();
    const { user_id, day } = query;
    const stmt = db.prepare('DELETE FROM journals WHERE user_id = @user_id AND day = @day');
    const result = stmt.run({ user_id, day });
    db.prepare('DELETE FROM entries_tags WHERE user_id = @user_id AND day = @day').run({
      user_id,
      day,
    });
    return result;
  } catch (error) {
    logger(`error`);
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

    const stmt = db.prepare(
      `UPDATE journals SET modified_at = @modified_at, content = @content WHERE day = @day and user_id = @user_id`,
    );
    return stmt.run({ user_id, day, modified_at, content });
  } catch (error) {
    logger(`error`);
    logger(error);
    return error;
  }
});

ipcMain.handle('cache-update-entry-property', async (_event, set, where) => {
  logger('cache-update-entry-property');
  try {
    const db = getDB();
    const { user_id, day } = where;

    // Prevent overring sync_status of 'pening_insert' with 'pending_update'
    if (set.sync_status == 'pending_update') {
      const entry = db
        .prepare(`SELECT sync_status FROM journals WHERE day = @day and user_id = @user_id`)
        .get({ user_id, day }) as Entry;
      if (entry.sync_status == 'pending_insert') {
        logger(`Not changing sync_status to 'pending_update' because it's 'pending_insert'`);
        set.sync_status = 'pending_insert';
      }
    }

    let expr = '';
    for (const property in set) {
      expr += `${property} = @${property}, `;
    }
    expr = expr.slice(0, -2);

    const stmt = db.prepare(`UPDATE journals SET ${expr} WHERE day = @day and user_id = @user_id`);
    return stmt.run({ user_id, day, ...set });
  } catch (error) {
    logger(`error`);
    logger(error);
    return error;
  }
});

ipcMain.handle('cache-get-days', async (_event, user_id) => {
  logger('cache-get-days');
  try {
    const db = getDB();
    const stmt = db.prepare(
      "SELECT day, revision FROM journals WHERE user_id = @user_id AND sync_status != 'pending_delete' ORDER BY day ASC",
    );
    const result = stmt.all({ user_id }) as Entry[];
    return result;
  } catch (error) {
    logger(`error`);
    logger(error);
    return error;
  }
});

ipcMain.handle('cache-get-entries', async (_event, user_id) => {
  logger('cache-get-entries');
  try {
    const db = getDB();
    const stmt = db.prepare(
      "SELECT * FROM journals WHERE user_id = @user_id AND sync_status != 'pending_delete'",
    );
    const result = stmt.all({ user_id });
    result.forEach((element: any) => {
      element.content = JSON.parse(element.content);
    });
    return result;
  } catch (error) {
    logger(`error`);
    logger(error);
    return error;
  }
});

ipcMain.handle('cache-get-pending-delete-entries', async (_event, user_id) => {
  logger('cache-get-pending-delete-entries');
  try {
    const db = getDB();
    const stmt = db.prepare(
      "SELECT * FROM journals WHERE user_id = @user_id AND sync_status = 'pending_delete'",
    );
    const result = stmt.all({ user_id });
    logger(`Pending delete entries: ${result.length}`);
    return result;
  } catch (error) {
    logger(`error`);
    logger(error);
    return error;
  }
});

ipcMain.handle('cache-get-pending-insert-entries', async (_event, user_id) => {
  logger('cache-get-pending-insert-entries');
  try {
    const db = getDB();
    const stmt = db.prepare(
      "SELECT * FROM journals WHERE user_id = @user_id AND sync_status = 'pending_insert'",
    );
    const result = stmt.all({ user_id });
    logger(`Pending insert entries: ${result.length}`);
    return result;
  } catch (error) {
    logger(`error`);
    logger(error);
    return error;
  }
});

ipcMain.handle('cache-get-pending-update-entries', async (_event, user_id) => {
  logger('cache-get-pending-update-entries');
  try {
    const db = getDB();
    const stmt = db.prepare(
      "SELECT * FROM journals WHERE user_id = @user_id AND sync_status = 'pending_update'",
    );
    const result = stmt.all({ user_id });
    logger(`Pending update entries: ${result.length}`);
    return result;
  } catch (error) {
    logger(`error`);
    logger(error);
    return error;
  }
});

ipcMain.handle('cache-delete-all', async (_event, user_id) => {
  logger('cache-delete-all');
  try {
    const db = getDB();
    db.prepare('DELETE FROM journals WHERE user_id = @user_id').run({ user_id });
    db.prepare('DELETE FROM journals_catalog WHERE user_id = @user_id').run({ user_id });
    db.prepare('DELETE FROM entries_tags WHERE user_id = @user_id').run({ user_id });
  } catch (error) {
    logger(`error`);
    logger(error);
    return error;
  }
});

ipcMain.handle('cache-does-entry-exist', async (_event: any, user_id: string, day: string) => {
  logger('cache-does-entry-exist');
  try {
    const db = getDB();
    const result = db
      .prepare('SELECT EXISTS(SELECT 1 FROM journals WHERE user_id = @user_id AND day = @day)')
      .get({ user_id, day });
    const exists = !!Object.values(result)[0];
    logger(`Entry ${day} exists = ${exists}`);
    return exists;
  } catch (error) {
    logger(`error`);
    logger(error);
    return error;
  }
});

ipcMain.handle('cache-get-entries-count', async (_event, user_id) => {
  logger('cache-get-entries-count');
  try {
    const db = getDB();
    const result = db
      .prepare(
        "SELECT count(*) FROM journals WHERE user_id = @user_id AND sync_status != 'pending_delete' AND created_at > @betaEndDate",
      )
      .get({ user_id, betaEndDate });
    return Object.values(result)[0] ?? 0;
  } catch (error) {
    logger(`error`);
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
    const stmt = db.prepare(
      `INSERT INTO tags (id, user_id, name, color, created_at, modified_at, revision, sync_status ) VALUES (@id, @user_id, @name, @color, @created_at, @modified_at, @revision, @sync_status )
      ON CONFLICT(id) DO UPDATE SET name = excluded.name, color = excluded.color, modified_at = excluded.modified_at, revision = excluded.revision, sync_status = excluded.sync_status`,
    );
    return stmt.run({ id, user_id, name, color, created_at, modified_at, revision, sync_status });
  } catch (error) {
    logger(`error`);
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
        .prepare(`SELECT sync_status FROM tags WHERE id = @tag_id`)
        .get({ tag_id }) as Tag;
      if (tag.sync_status == 'pending_insert') {
        logger(`Not changing sync_status to 'pending_update' because it's 'pending_insert'`);
        set.sync_status = 'pending_insert';
      }
    }

    let expr = '';
    for (const property in set) {
      expr += `${property} = @${property}, `;
    }
    expr = expr.slice(0, -2);

    const stmt = db.prepare(`UPDATE tags SET ${expr} WHERE id = @tag_id`);
    return stmt.run({ tag_id, ...set });
  } catch (error) {
    logger(`error`);
    logger(error);
    return error;
  }
});

ipcMain.handle('cache-get-tags', async (_event, user_id) => {
  logger('cache-get-tags');
  try {
    const db = getDB();
    const stmt = db.prepare(
      "SELECT * FROM tags WHERE user_id = @user_id AND sync_status != 'pending_delete' ORDER BY modified_at DESC",
    );
    const result = stmt.all({ user_id });
    return result;
  } catch (error) {
    logger(`error`);
    logger(error);
    return error;
  }
});

ipcMain.handle('cache-get-days-with-tag', async (_event, tag_id) => {
  logger('cache-get-days-with-tag');
  try {
    const db = getDB();
    const stmt = db.prepare('SELECT day FROM entries_tags WHERE tag_id = @tag_id');
    const result = stmt.all({ tag_id }) as EntryTag[];
    const daysArray: string[] = [];
    for (const [, value] of Object.entries(result)) {
      daysArray.push(value.day);
    }
    return daysArray;
  } catch (error) {
    logger(`error`);
    logger(error);
    return error;
  }
});

ipcMain.handle('cache-get-tag', async (_event, id) => {
  logger('cache-get-tag');
  try {
    const db = getDB();
    return db.prepare('SELECT * FROM tags WHERE id = @id').get({ id });
  } catch (error) {
    logger(`error`);
    logger(error);
    return error;
  }
});

ipcMain.handle('cache-get-pending-delete-tags', async (_event, user_id) => {
  logger('cache-get-pending-delete-tags');
  try {
    const db = getDB();
    const stmt = db.prepare(
      "SELECT * FROM tags WHERE user_id = @user_id AND sync_status = 'pending_delete'",
    );
    const result = stmt.all({ user_id });
    logger(`Pending delete tags: ${result.length}`);
    return result;
  } catch (error) {
    logger(`error`);
    logger(error);
    return error;
  }
});

ipcMain.handle('cache-get-pending-update-tags', async (_event, user_id) => {
  logger('cache-get-pending-update-tags');
  try {
    const db = getDB();
    const stmt = db.prepare(
      "SELECT * FROM tags WHERE user_id = @user_id AND sync_status = 'pending_update'",
    );
    const result = stmt.all({ user_id });
    logger(`Pending update tags: ${result.length}`);
    return result;
  } catch (error) {
    logger(`error`);
    logger(error);
    return error;
  }
});

ipcMain.handle('cache-get-pending-insert-tags', async (_event, user_id) => {
  logger('cache-get-pending-insert-tags');
  try {
    const db = getDB();
    const stmt = db.prepare(
      "SELECT * FROM tags WHERE user_id = @user_id AND sync_status = 'pending_insert'",
    );
    const result = stmt.all({ user_id });
    logger(`Pending insert tags: ${result.length}`);
    return result;
  } catch (error) {
    logger(`error`);
    logger(error);
    return error;
  }
});

ipcMain.handle('cache-delete-tag', async (_event, tag_id) => {
  logger('cache-delete-tag');
  try {
    const db = getDB();
    const stmt = db.prepare('DELETE FROM tags WHERE id = @tag_id');
    const result = stmt.run({ tag_id });
    return result;
  } catch (error) {
    logger(`error`);
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
    const stmt = db.prepare(
      `INSERT INTO entries_tags (user_id, day, tag_id, order_no, created_at, modified_at, revision, sync_status ) VALUES (@user_id, @day, @tag_id, @order_no, @created_at, @modified_at, @revision, @sync_status )
      ON CONFLICT(user_id, day, journal_id, tag_id) DO UPDATE SET order_no = excluded.order_no, modified_at = excluded.modified_at, revision = excluded.revision, sync_status = excluded.sync_status`,
    );
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
    logger(`error`);
    logger(error);
    return error;
  }
});

ipcMain.handle('cache-get-pending-insert-entry-tags', async (_event, user_id) => {
  logger('cache-get-pending-insert-entry-tags');
  try {
    const db = getDB();
    const stmt = db.prepare(
      "SELECT * FROM entries_tags WHERE user_id = @user_id AND sync_status = 'pending_insert'",
    );
    const result = stmt.all({ user_id });
    logger(`Pending insert entry tags: ${result.length}`);
    return result;
  } catch (error) {
    logger(`error`);
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
          .prepare(
            `SELECT sync_status FROM entries_tags WHERE user_id = @user_id AND day = @day AND tag_id = @tag_id`,
          )
          .get({ user_id, day, tag_id }) as EntryTag;
        if (entryTag.sync_status == 'pending_insert') {
          logger(`Not changing sync_status to 'pending_update' because it's 'pending_insert'`);
          set.sync_status = 'pending_insert';
        }
      }

      let expr = '';
      for (const property in set) {
        expr += `${property} = @${property}, `;
      }
      expr = expr.slice(0, -2);

      const stmt = db.prepare(
        `UPDATE entries_tags SET ${expr} WHERE user_id = @user_id AND day = @day AND tag_id = @tag_id`,
      );
      return stmt.run({ user_id, day, tag_id, ...set });
    } catch (error) {
      logger(`error`);
      logger(error);
      return error;
    }
  },
);

ipcMain.handle('cache-get-pending-delete-entry-tags', async (event, user_id) => {
  logger('cache-get-pending-delete-entry-tags');
  try {
    const db = getDB();
    const stmt = db.prepare(
      "SELECT * FROM entries_tags WHERE user_id = @user_id AND sync_status = 'pending_delete'",
    );
    const result = stmt.all({ user_id });
    logger(`Pending delete entry tags: ${result.length}`);
    return result;
  } catch (error) {
    logger(`error`);
    logger(error);
    return error;
  }
});

ipcMain.handle('cache-delete-entry-tag', async (event, user_id, tag_id, day) => {
  logger('cache-delete-entry-tag');
  try {
    const db = getDB();
    const stmt = db.prepare(
      'DELETE FROM entries_tags WHERE user_id = @user_id AND day = @day AND tag_id = @tag_id',
    );
    const result = stmt.run({ user_id, tag_id, day });
    return result;
  } catch (error) {
    logger(`error`);
    logger(error);
    return error;
  }
});

ipcMain.handle('cache-get-pending-update-entry-tags', async (event, user_id) => {
  logger('cache-get-pending-update-entry-tags');
  try {
    const db = getDB();
    const stmt = db.prepare(
      "SELECT * FROM entries_tags WHERE user_id = @user_id AND sync_status = 'pending_update'",
    );
    const result = stmt.all({ user_id });
    logger(`Pending update entry tags: ${result.length}`);
    return result;
  } catch (error) {
    logger(`error`);
    logger(error);
    return error;
  }
});

ipcMain.handle('cache-get-entry-tags', async (event, user_id) => {
  logger('cache-get-entry-tags');
  try {
    const db = getDB();
    const stmt = db.prepare(
      "SELECT * FROM entries_tags WHERE user_id = @user_id AND sync_status != 'pending_delete'",
    );
    const result = stmt.all({ user_id }) as EntryTag[];
    return result;
  } catch (error) {
    logger(`error`);
    logger(error);
    return error;
  }
});

ipcMain.handle('cache-get-entry-tags-on-day', async (event, user_id, day) => {
  logger('cache-get-entry-tags-on-day');
  try {
    const db = getDB();
    const stmt = db.prepare(
      "SELECT * FROM entries_tags WHERE user_id = @user_id AND day = @day AND sync_status != 'pending_delete'",
    );
    const result = stmt.all({ user_id, day }) as EntryTag[];
    return result;
  } catch (error) {
    logger(`error`);
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
    const stmt1 = db.prepare('SELECT value FROM app WHERE key = @key');
    const lastUser = stmt1.get({ key: 'lastUser' }) as { value: string };
    if (lastUser) {
      const stmt2 = db.prepare('SELECT * FROM preferences WHERE user_id = @user_id');
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
    logger(`error`);
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
    const stmt = db.prepare(
      `INSERT INTO preferences (user_id, item, value) VALUES (@user_id, @item, @value)
      ON CONFLICT(user_id, item) DO UPDATE SET value = excluded.value`,
    );
    return stmt.run({ user_id, item, value });
  } catch (error) {
    logger(`error`);
    logger(error);
    return error;
  }
});

ipcMain.handle('preferences-delete-all', async (event, user_id) => {
  logger('preferences-delete-all');
  try {
    const db = getDB();
    const stmt = db.prepare('DELETE FROM preferences WHERE user_id = @user_id');
    const result = stmt.run({ user_id });
    return result;
  } catch (error) {
    logger(`error`);
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
    const stmt = db.prepare('SELECT value FROM app WHERE key = @key');
    const res = stmt.get({ key }) as { value: string };
    event.returnValue = res.value;
  } catch (error) {
    logger(`error`);
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
    const stmt = db.prepare(
      `INSERT INTO app (key, value) VALUES (@key, @value)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    );
    stmt.run({ key, value });
  } catch (error) {
    logger(`error`);
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
    const stmt = db.prepare('INSERT INTO users (id) VALUES (@id) ON CONFLICT (id) DO NOTHING');
    stmt.run({ id });
    // Create default journal_catalog for the user
    const create_journal = db.prepare(
      'INSERT INTO journals_catalog (user_id) VALUES (@id) ON CONFLICT (user_id, journal_id) DO NOTHING',
    );
    return create_journal.run({ id });
  } catch (error) {
    logger(`error`);
    logger(error);
    return error;
  }
});

ipcMain.handle('user-save-secret-key', async (event, user_id, secretKey) => {
  logger('user-save-secret-key');
  try {
    const encryptedSecreyKey = safeStorage.encryptString(secretKey);
    const db = getDB();
    const stmt = db.prepare(
      'UPDATE users SET secret_key = @encryptedSecreyKey WHERE id = @user_id',
    );
    stmt.run({ encryptedSecreyKey, user_id });
  } catch (error) {
    logger(`error`);
    logger(error);
  }
});

ipcMain.handle('app-get-secret-key', async (event, user_id) => {
  logger('app-get-secret-key');
  try {
    const db = getDB();
    const stmt = db.prepare('SELECT secret_key FROM users WHERE id = @user_id');
    const res = stmt.get({ user_id }) as { secret_key: Buffer };
    if (res?.secret_key) {
      return safeStorage.decryptString(res.secret_key);
    } else {
      return null;
    }
  } catch (error) {
    logger(`error`);
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
      const stmt = db.prepare(
        `INSERT INTO users (id, subscription) VALUES (@id, @subscription)
        ON CONFLICT(id) DO UPDATE SET subscription = excluded.subscription`,
      );
      stmt.run({ id: user_id, subscription: JSON.stringify(subscription) });
    } catch (error) {
      logger(`error`);
      logger(error);
    }
  },
);

ipcMain.on('user-get-subscription', (event, user_id: string) => {
  logger('user-get-subscription');
  try {
    const db = getDB();
    const stmt = db.prepare('SELECT subscription FROM users WHERE id = @user_id');
    const res = stmt.get({ user_id }) as { subscription: string };
    if (res?.subscription) {
      event.returnValue = JSON.parse(res.subscription);
    } else {
      event.returnValue = null;
    }
  } catch (error) {
    logger(`error`);
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
    const stmt = db.prepare("SELECT value FROM app WHERE key = 'windowBounds'");
    const res = stmt.get() as { value: string };
    if (res?.value) {
      return JSON.parse(res.value);
    } else {
      return { width: defaultWidth, height: defaultHeight };
    }
  } catch (error) {
    logger(`error`);
    logger(error);
    return { width: defaultWidth, height: defaultHeight };
  }
};

const setAppBounds = (value: Electron.Rectangle) => {
  try {
    const db = getDB();
    const stmt = db.prepare(
      `INSERT INTO app (key, value) VALUES ('windowBounds', @value)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    );
    stmt.run({ value: JSON.stringify(value) });
  } catch (error) {
    logger(`error`);
    logger(error);
  }
};

const getLastUser = () => {
  logger('getLastUser');
  try {
    const db = getDB();
    const stmt = db.prepare('SELECT value FROM app WHERE key = @key');
    const lastUser = stmt.get({ key: 'lastUser' }) as { value: string };
    return lastUser?.value ?? null;
  } catch (error) {
    logger(`error`);
    logger(error);
    return null;
  }
};

export { getLastUser, getAppBounds, setAppBounds, sqliteEvents };
