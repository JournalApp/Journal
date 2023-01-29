import { Page } from 'playwright'
import { test, expect } from '@playwright/test'
import { ElectronApplication, _electron as electron } from 'playwright-core'
import { ElectronAppInfo, startApp } from './helpers/electron'
import {
  supabaseRegisterUser,
  supabaseDeleteUser,
  supabaseGetEntry,
  supabaseCopyEntryToDayBefore,
  supabaseDeleteEntry,
  supabaseCopyEntryContent,
} from './helpers/supabase'
import { sqliteGetDB, sqliteDeleteDB, sqliteCreateCopyDB } from './helpers/sqlite'
import { getRecordingPath, pause } from './helpers/utils'
import log from 'loglevel'
import dayjs from 'dayjs'
import { faker } from '@faker-js/faker'

import { customAlphabet } from 'nanoid'
const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 10)

let appWindow: Page
let appInfo: ElectronAppInfo
let electronApp: ElectronApplication
let userData: string

let user_id: string
let email = 'test_' + nanoid(8) + '@test.com'
let today = dayjs().format('YYYY-MM-DD')
let fakeToday = dayjs().add(1, 'day').format('YYYY-MM-DD')
let yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD')
let beforeYesterday = dayjs().subtract(2, 'day').format('YYYY-MM-DD')
// let text = faker.random.words(10).split(' ')
let text = [
  faker.lorem.sentence(),
  faker.lorem.sentence(),
  faker.lorem.sentence(),
  faker.lorem.sentence(),
  faker.lorem.sentence(),
  faker.lorem.sentence(),
  faker.lorem.sentence(),
]
let day: string
let created_at: string
let modified_at: string
let revision: number

test.beforeAll(async () => {
  const startAppResponse = await startApp()
  appWindow = startAppResponse.appWindow
  appInfo = startAppResponse.appInfo
  electronApp = startAppResponse.electronApp
  userData = await electronApp.evaluate(async ({ app }) => {
    return app.getPath('userData')
  })
  await pause(2000)
  const isOnLoginScreen = await appWindow.getByTestId('refresh-token-login').isVisible()
  if (!isOnLoginScreen) {
    // Logout
    await appWindow.getByTestId('menu-main').click()
    await appWindow.getByTestId('menu-main-logout').click()
    await pause(2000)
    await electronApp.close()

    // Open app again
    const startAppResponse = await startApp()
    appWindow = startAppResponse.appWindow
    appInfo = startAppResponse.appInfo
    electronApp = startAppResponse.electronApp
    await pause(3000)
  }
})

test.afterEach(async () => {
  await pause(2000)
  appWindow.on('console', log.info)
})

test('Signup', async () => {
  const { refresh_token, user } = await supabaseRegisterUser(email)
  user_id = user.id
  await appWindow.getByTestId('refresh-token-login').fill(refresh_token)
  await appWindow.getByTestId('refresh-token-login').press('Enter')
})

////////////////////////////////////////////////////
// 1st launch
////////////////////////////////////////////////////

test('Today is ready', async () => {
  await expect(
    appWindow.locator(`[id='${today}-entry']`).getByRole('textbox').first()
  ).toBeFocused()
})

test('Today typing works', async () => {
  await appWindow.keyboard.type(text[0], { delay: 50 })
  await expect(appWindow.getByText(text[0])).toBeVisible()
})

test('Today entry is saved in SQLite', async () => {
  const sqliteEntry = await sqliteGetDB(userData, user_id, today)
  day = sqliteEntry.day
  created_at = sqliteEntry.created_at
  modified_at = sqliteEntry.modified_at
  revision = sqliteEntry.revision
  expect(sqliteEntry.content).toContain(text[0])
  expect(sqliteEntry.sync_status).toBe('synced')
})

test('Today entry is saved in Supabase', async () => {
  const supabaseEntry = await supabaseGetEntry(user_id, today)
  expect(dayjs(day).isSame(supabaseEntry.day)).toBe(true)
  expect(dayjs(created_at).isSame(supabaseEntry.created_at)).toBe(true)
  expect(dayjs(modified_at).isSame(supabaseEntry.modified_at)).toBe(true)
  expect(revision == supabaseEntry.revision).toBe(true)
})

test('Yesterday entry is inserted by realtime', async () => {
  await supabaseCopyEntryToDayBefore(user_id, today)
  await pause(1000)
  await appWindow.mouse.wheel(0, -500)
  await pause(500)
  await expect(appWindow.getByText(text[0])).toHaveCount(2)
})

test('Yesterday entry is deleted by realtime', async () => {
  await supabaseDeleteEntry(user_id, yesterday)
  await pause(1000)
  await expect(appWindow.getByText(text[0])).toHaveCount(1)
})

test('Add entry beforeYesterday manually', async () => {
  await appWindow.getByTestId('calendar-toggle').click()
  await pause(500)
  await appWindow.locator(`[id='${beforeYesterday}-calendar']`).click()
  await expect(
    appWindow.locator(`[id='${beforeYesterday}-entry']`).getByRole('textbox').first()
  ).toBeFocused()
  await appWindow.keyboard.type(text[1], { delay: 50 })
  await expect(appWindow.getByText(text[1])).toBeVisible()
})

test('Today entry is updatd by realtime', async () => {
  await supabaseCopyEntryContent(user_id, beforeYesterday, today)
  await pause(1000)
  await expect(appWindow.getByText(text[1])).toHaveCount(2)
})

////////////////////////////////////////////////////
// The end
////////////////////////////////////////////////////

test('Logout', async () => {
  await sqliteCreateCopyDB(userData, email)
  await appWindow.getByTestId('menu-main').click()
  await pause(1000)
  await appWindow.getByTestId('menu-main-logout').click()
})

test.afterAll(async () => {
  await appWindow.screenshot({
    path: getRecordingPath(appInfo.platform, 'final-screen.png'),
  })
  await appWindow.context().close()
  await appWindow.close()
  await electronApp.close()
  await supabaseDeleteUser(user_id)
  await sqliteDeleteDB(userData)
})
