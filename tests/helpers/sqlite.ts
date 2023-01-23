import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import * as fs from 'fs'

const dbFile = 'cache-test.db'

export async function sqliteGetDB(userDataPath: string, user_id: string, day: string) {
  const db = await open({
    filename: userDataPath + '/' + dbFile,
    driver: sqlite3.Database,
  })
  const result = await db.get(
    `select * from journals where user_id = '${user_id}' and day = '${day}'`
  )
  return result
}

export async function sqliteDeleteDB(userDataPath: string) {
  await fs.promises.unlink(userDataPath + '/' + dbFile)
}

export async function sqliteRenameDB(userDataPath: string, name: string) {
  await fs.promises.rename(
    userDataPath + '/' + dbFile,
    userDataPath + '/' + `cache-test-${name}.db`
  )
}

export async function sqliteCreateCopyDB(userDataPath: string, name: string) {
  await fs.promises.copyFile(
    userDataPath + '/' + dbFile,
    userDataPath + '/' + `cache-test-${name}.db`
  )
}
