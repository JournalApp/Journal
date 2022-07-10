import { app, BrowserWindow, ipcMain } from 'electron'
import Database from 'better-sqlite3'
import log from 'electron-log'
import initializeSql from '../sql/schema.sqlite.sql'
import dayjs from 'dayjs'
import { logger, isDev } from '../utils'

var database: any

const getDB = () => {
  if (!database) {
    const dbName = isDev() ? 'cache-dev.db' : 'cache.db'
    database = new Database(app.getPath('userData') + '/' + dbName)
    // database = new Database(app.getPath('userData') + '/cache.db', { verbose: logger })
  }
  return database
}

const initializeDB = () => {
  const db = getDB()
  db.exec(initializeSql)
}

try {
  getDB()
  initializeDB()
} catch (error) {
  logger(error)
  log.error(error)
}

// Entries

ipcMain.handle('cache-add-user', async (event, id) => {
  logger('cache-add-user')
  try {
    const db = getDB()
    const stmt = db.prepare('INSERT INTO users (id) VALUES (@id) ON CONFLICT (id) DO NOTHING')
    return stmt.run({ id })
  } catch (error) {
    logger(`error`)
    logger(error)
    return error
  }
})

ipcMain.handle('cache-add-or-update-entry', async (event, val) => {
  logger('cache-add-or-update-entry')
  try {
    const db = getDB()
    const { user_id, day, created_at, modified_at, content } = val
    const stmt = db.prepare(
      `INSERT INTO journals (user_id, day, created_at, modified_at, content) VALUES (@user_id, @day, @created_at, @modified_at, @content)
      ON CONFLICT(user_id, day) DO UPDATE SET content = excluded.content, modified_at = excluded.modified_at`
    )
    return stmt.run({ user_id, day, created_at, modified_at, content })
  } catch (error) {
    logger(`error`)
    logger(error)
    return error
  }
})

ipcMain.handle('cache-delete-entry', async (event, query) => {
  logger('cache-delete-entry')
  try {
    const db = getDB()
    const { user_id, day } = query
    const stmt = db.prepare('DELETE FROM journals WHERE user_id = @user_id AND day = @day')
    const result = stmt.run({ user_id, day })
    return result
  } catch (error) {
    logger(`error`)
    logger(error)
    return error
  }
})

ipcMain.handle('cache-mark-deleted-entry', async (event, query) => {
  logger('cache-mark-deleted-entry')
  try {
    const db = getDB()
    const { user_id, day } = query
    const stmt = db.prepare(
      'UPDATE journals SET deleted = TRUE WHERE user_id = @user_id AND day = @day'
    )
    const result = stmt.run({ user_id, day })
    return result
  } catch (error) {
    logger(`error`)
    logger(error)
    return error
  }
})

ipcMain.handle('cache-update-entry', async (event, set, where) => {
  logger('cache-update-entry')
  try {
    const db = getDB()
    const { user_id, day } = where
    const { modified_at, content } = set

    const stmt = db.prepare(
      `UPDATE journals SET modified_at = @modified_at, content = @content WHERE day = @day and user_id = @user_id`
    )
    return stmt.run({ user_id, day, modified_at, content })
  } catch (error) {
    logger(`error`)
    logger(error)
    return error
  }
})

ipcMain.handle('cache-update-entry-property', async (event, set, where) => {
  logger('cache-update-entry-property')
  try {
    const db = getDB()
    const { user_id, day } = where
    const property = Object.keys(set)[0] as string
    const value = Object.values(set)[0]

    const stmt = db.prepare(
      `UPDATE journals SET ${property} = @value WHERE day = @day and user_id = @user_id`
    )
    return stmt.run({ user_id, day, value })
  } catch (error) {
    logger(`error`)
    logger(error)
    return error
  }
})

ipcMain.handle('cache-get-days', async (event, user_id) => {
  logger('cache-get-days')
  try {
    const db = getDB()
    const stmt = db.prepare(
      'SELECT day FROM journals WHERE user_id = @user_id AND deleted = FALSE ORDER BY day ASC'
    )
    const result = stmt.all({ user_id }) as any[]
    var days = result.map((entry: any) => entry.day)
    let today = dayjs().format('YYYY-MM-DD')
    let todayExists = days.some((el: any) => {
      return el == today
    })
    if (!todayExists) {
      days.push(today)
      logger(`Added ${today} in cache-get-days`)
    }
    return days
  } catch (error) {
    logger(`error`)
    logger(error)
    return error
  }
})

ipcMain.handle('cache-get-entries', async (event, user_id) => {
  logger('cache-get-entries')
  try {
    const db = getDB()
    const stmt = db.prepare('SELECT * FROM journals WHERE user_id = @user_id AND deleted = FALSE')
    var result = stmt.all({ user_id })
    result.forEach((element: any) => {
      element.content = JSON.parse(element.content)
    })
    return result
  } catch (error) {
    logger(`error`)
    logger(error)
    return error
  }
})

ipcMain.handle('cache-get-deleted-days', async (event, user_id) => {
  logger('cache-get-deleted-days')
  try {
    const db = getDB()
    const stmt = db.prepare('SELECT day FROM journals WHERE user_id = @user_id AND deleted = TRUE')
    const result = stmt.all({ user_id })
    const days = result.map((entry: any) => entry.day)
    logger('Deleted days:')
    logger(days)
    return days
  } catch (error) {
    logger(`error`)
    logger(error)
    return error
  }
})

ipcMain.handle('cache-delete-all', async (event, user_id) => {
  logger('cache-delete-all')
  try {
    const db = getDB()
    const stmt = db.prepare('DELETE FROM journals WHERE user_id = @user_id')
    return stmt.run({ user_id })
  } catch (error) {
    logger(`error`)
    logger(error)
    return error
  }
})

// Preferences

ipcMain.on('preferences-get-all', (event, user_id?) => {
  interface prefMap {
    [key: string]: string
  }

  logger('preferences-get-all')
  try {
    const db = getDB()
    const stmt1 = db.prepare('SELECT value FROM app WHERE key = @key')
    const lastUser = stmt1.get({ key: 'lastUser' })
    if (lastUser) {
      const stmt2 = db.prepare('SELECT * FROM preferences WHERE user_id = @user_id')
      let prefs = stmt2.all({ user_id: user_id || lastUser.value })
      if (prefs.length) {
        let prettyPrefs = {} as prefMap
        for (let i = 0; i < prefs.length; i++) {
          prettyPrefs[prefs[i].item] = prefs[i].value
        }
        event.returnValue = prettyPrefs
      } else {
        event.returnValue = undefined
      }
    } else {
      event.returnValue = undefined
    }
  } catch (error) {
    logger(`error`)
    logger(error)
    event.returnValue = error
  }
})

ipcMain.handle('preferences-set', async (event, user_id, set) => {
  logger('preferences-set')
  try {
    const db = getDB()
    const item = Object.keys(set)[0]
    const value = Object.values(set)[0]
    const stmt = db.prepare(
      `INSERT INTO preferences (user_id, item, value) VALUES (@user_id, @item, @value)
      ON CONFLICT(user_id, item) DO UPDATE SET value = excluded.value`
    )
    return stmt.run({ user_id, item, value })
  } catch (error) {
    logger(`error`)
    logger(error)
    return error
  }
})

ipcMain.handle('preferences-delete-all', async (event, user_id) => {
  logger('preferences-delete-all')
  try {
    const db = getDB()
    const stmt = db.prepare('DELETE FROM preferences WHERE user_id = @user_id')
    const result = stmt.run({ user_id }) as any[]
    return result
  } catch (error) {
    logger(`error`)
    logger(error)
    return error
  }
})

// App (sync api)

ipcMain.on('app-get-key', (event, key) => {
  logger('app-get-key')
  try {
    const db = getDB()
    const stmt = db.prepare('SELECT value FROM app WHERE key = @key')
    let res = stmt.get({ key })
    event.returnValue = res.value
  } catch (error) {
    logger(`error`)
    logger(error)
    event.returnValue = error
  }
})

ipcMain.handle('app-set-key', async (event, set) => {
  logger('app-set-key')
  try {
    const db = getDB()
    const key = Object.keys(set)[0]
    const value = Object.values(set)[0]
    const stmt = db.prepare(
      `INSERT INTO app (key, value) VALUES (@key, @value)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value`
    )
    stmt.run({ key, value })
  } catch (error) {
    logger(`error`)
    logger(error)
  }
})

// functions

const getAppBounds = (defaultWidth: number, defaultHeight: number) => {
  try {
    const db = getDB()
    const stmt = db.prepare("SELECT value FROM app WHERE key = 'windowBounds'")
    let res = stmt.get()
    if (res?.value) {
      return JSON.parse(res.value)
    } else {
      return { width: defaultWidth, height: defaultHeight }
    }
  } catch (error) {
    logger(`error`)
    logger(error)
    return { width: defaultWidth, height: defaultHeight }
  }
}

const setAppBounds = (value: Electron.Rectangle) => {
  try {
    const db = getDB()
    const stmt = db.prepare(
      `INSERT INTO app (key, value) VALUES (\'windowBounds\', @value)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value`
    )
    stmt.run({ value: JSON.stringify(value) })
  } catch (error) {
    logger(`error`)
    logger(error)
  }
}

const getLastUser = () => {
  logger('getLastUser')
  try {
    const db = getDB()
    const stmt = db.prepare('SELECT value FROM app WHERE key = @key')
    const lastUser = stmt.get({ key: 'lastUser' })
    return lastUser?.value ?? 'anonymous'
  } catch (error) {
    logger(`error`)
    logger(error)
    return 'anonymous'
  }
}

export { getLastUser, getAppBounds, setAppBounds }
