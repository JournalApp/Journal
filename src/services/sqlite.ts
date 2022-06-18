import { app, BrowserWindow, ipcMain } from 'electron'
import Database from 'better-sqlite3'
import log from 'electron-log'
import initializeSql from '../sql/schema.sqlite.sql'
import { supabaseUrl, supabaseAnonKey } from 'utils'

var database: any

const getDB = () => {
  if (!database) {
    database = new Database(app.getPath('userData') + '/cache.db', { verbose: console.log })
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
  console.log(error)
  log.error(error)
}

ipcMain.handle('sqlite-query', async (event, val) => {
  try {
    const db = getDB()
    const result = db.prepare(val).all()
    return result
  } catch (error) {
    console.log(`error`)
    console.log(error)
    return error
  }
})
