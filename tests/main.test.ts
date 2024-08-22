import { Page } from 'playwright';
import { test, expect } from '@playwright/test';
import { ElectronApplication } from 'playwright-core';
import { ElectronAppInfo, startApp } from './helpers/electron';
import {
  supabaseRegisterUser,
  supabaseDeleteUser,
  supabaseGetEntry,
} from './helpers/supabase';
import { sqliteGetDB, sqliteDeleteDB, sqliteCreateCopyDB } from './helpers/sqlite';
import { getRecordingPath, pause } from './helpers/utils';
import log from 'loglevel';
import dayjs from 'dayjs';
import { faker } from '@faker-js/faker';
import { customAlphabet } from 'nanoid';
const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 10);

let appWindow: Page;
let appInfo: ElectronAppInfo;
let electronApp: ElectronApplication;
let userData: string;

let user_id: string;
const email = 'test_' + nanoid(8) + '@test.com';
const today = dayjs().format('YYYY-MM-DD');
const fakeToday = dayjs().add(1, 'day').format('YYYY-MM-DD');
const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
// let text = faker.random.words(10).split(' ')
const text = [
  faker.lorem.sentence(),
  faker.lorem.sentence(),
  faker.lorem.sentence(),
  faker.lorem.sentence(),
  faker.lorem.sentence(),
];
let day: string;
let created_at: string;
let modified_at: string;
let revision: number;

test.beforeAll(async () => {
  const startAppResponse = await startApp();
  appWindow = startAppResponse.appWindow;
  appInfo = startAppResponse.appInfo;
  electronApp = startAppResponse.electronApp;
  userData = await electronApp.evaluate(async ({ app }) => {
    return app.getPath('userData');
  });
  await pause(2000);
  const isOnLoginScreen = await appWindow.getByTestId('refresh-token-login').isVisible();
  if (!isOnLoginScreen) {
    // Logout
    await appWindow.getByTestId('menu-main').click();
    await appWindow.getByTestId('menu-main-logout').click();
    await pause(2000);
    await electronApp.close();

    // Open app again
    const startAppResponse = await startApp();
    appWindow = startAppResponse.appWindow;
    appInfo = startAppResponse.appInfo;
    electronApp = startAppResponse.electronApp;
    await pause(3000);
  }
});

test.afterEach(async () => {
  await pause(2000);
  appWindow.on('console', log.info);
});

test('Signup', async () => {
  const { refresh_token, user } = await supabaseRegisterUser(email);
  user_id = user.id;
  await appWindow.getByTestId('refresh-token-login').fill(refresh_token);
  await appWindow.getByTestId('refresh-token-login').press('Enter');
});

////////////////////////////////////////////////////
// 1st launch
////////////////////////////////////////////////////

test('Today is ready', async () => {
  await expect(
    appWindow.locator(`[id='${today}-entry']`).getByRole('textbox').first()
  ).toBeFocused();
});

test('Today typing works', async () => {
  await appWindow.keyboard.type(text[0], { delay: 50 });
  await expect(appWindow.getByText(text[0])).toBeVisible();
});

test('Today entry is saved in SQLite', async () => {
  const sqliteEntry = await sqliteGetDB(userData, user_id, today);
  day = sqliteEntry.day;
  created_at = sqliteEntry.created_at;
  modified_at = sqliteEntry.modified_at;
  revision = sqliteEntry.revision;
  expect(sqliteEntry.content).toContain(text[0]);
  expect(sqliteEntry.sync_status).toBe('synced');
});

test('Today entry is saved in Supabase', async () => {
  const supabaseEntry = await supabaseGetEntry(user_id, today);
  expect(dayjs(day).isSame(supabaseEntry.day)).toBe(true);
  expect(dayjs(created_at).isSame(supabaseEntry.created_at)).toBe(true);
  expect(dayjs(modified_at).isSame(supabaseEntry.modified_at)).toBe(true);
  expect(revision == supabaseEntry.revision).toBe(true);
});

test('Add new day', async () => {
  await appWindow.getByTestId('calendar-toggle').click();
  await pause(500);
  await appWindow.locator(`[id='${yesterday}-calendar']`).click();
  await expect(
    appWindow.locator(`[id='${yesterday}-entry']`).getByRole('textbox').first()
  ).toBeFocused();
});

test('Yesterday typing works', async () => {
  await appWindow.keyboard.type(text[1], { delay: 50 });
  await expect(appWindow.getByText(text[1])).toBeVisible();
});

test('Yesterday entry is saved in SQLite', async () => {
  const sqliteEntry = await sqliteGetDB(userData, user_id, yesterday);
  day = sqliteEntry.day;
  created_at = sqliteEntry.created_at;
  modified_at = sqliteEntry.modified_at;
  revision = sqliteEntry.revision;
  expect(sqliteEntry.content).toContain(text[1]);
  expect(sqliteEntry.sync_status).toBe('synced');
});

test('Yesterday entry is saved in Supabase', async () => {
  const supabaseEntry = await supabaseGetEntry(user_id, yesterday);
  expect(dayjs(day).isSame(supabaseEntry.day)).toBe(true);
  expect(dayjs(created_at).isSame(supabaseEntry.created_at)).toBe(true);
  expect(dayjs(modified_at).isSame(supabaseEntry.modified_at)).toBe(true);
  expect(revision == supabaseEntry.revision).toBe(true);
});

////////////////////////////////////////////////////
// 2nd launch
////////////////////////////////////////////////////

test('Relaunch 1', async () => {
  await appWindow.close();
  const startAppResponse = await startApp();
  appWindow = startAppResponse.appWindow;
  appInfo = startAppResponse.appInfo;
  electronApp = startAppResponse.electronApp;
});

test('Relaunch 1 - Today renders content and is focused', async () => {
  await expect(
    appWindow.locator(`[id='${today}-entry']`).getByRole('textbox').first()
  ).toBeFocused();
  await expect(appWindow.getByText(text[0])).toBeVisible();
});

// Today - type new content & check
test('Relaunch 1 - Editing Today entry works', async () => {
  await appWindow.keyboard.press('Enter');
  await pause(100);
  await appWindow.keyboard.press('Enter');
  await pause(100);
  await appWindow.keyboard.press('ArrowUp');
  await pause(100);
  await appWindow.keyboard.press('ArrowUp');
  await pause(100);
  await appWindow.keyboard.type(text[2], { delay: 50 });
  await expect(appWindow.getByText(text[2])).toBeVisible();
});

test('Relaunch 1 - Edited Today is saved in SQLite', async () => {
  const sqliteEntry = await sqliteGetDB(userData, user_id, today);
  day = sqliteEntry.day;
  created_at = sqliteEntry.created_at;
  modified_at = sqliteEntry.modified_at;
  revision = sqliteEntry.revision;
  expect(sqliteEntry.content).toContain(text[0]);
  expect(sqliteEntry.content).toContain(text[2]);
  expect(sqliteEntry.sync_status).toBe('synced');
});

test('Relaunch 1 - Edited Today is saved in Supabase', async () => {
  const supabaseEntry = await supabaseGetEntry(user_id, today);
  expect(dayjs(day).isSame(supabaseEntry.day)).toBe(true);
  expect(dayjs(created_at).isSame(supabaseEntry.created_at)).toBe(true);
  expect(dayjs(modified_at).isSame(supabaseEntry.modified_at)).toBe(true);
  expect(revision == supabaseEntry.revision).toBe(true);
});

test('Relaunch 1 - Calendar is opened and I can click on yesterday', async () => {
  await appWindow.locator(`[id='${yesterday}-calendar']`).click();
});

test('Relaunch 1 - Yesterday renders content and is focused', async () => {
  await expect(
    appWindow.locator(`[id='${yesterday}-entry']`).getByRole('textbox').first()
  ).toBeFocused();
  await expect(appWindow.getByText(text[1])).toBeVisible();
});

// TODO type new content & check
test('Relaunch 1 - Editing Yesterday entry works', async () => {
  await appWindow.keyboard.press('ArrowDown');
  await pause(100);
  await appWindow.keyboard.press('ArrowDown');
  await pause(100);
  await appWindow.keyboard.press('ArrowDown');
  await pause(100);
  await appWindow.keyboard.press('ArrowDown');
  await pause(100);
  await appWindow.keyboard.press('Enter');
  await pause(100);
  await appWindow.keyboard.press('Enter');
  await pause(100);
  await appWindow.keyboard.type(text[3], { delay: 50 });
  await expect(appWindow.getByText(text[3])).toBeVisible();
});

test('Relaunch 1 - Edited Yesterday is saved in SQLite', async () => {
  const sqliteEntry = await sqliteGetDB(userData, user_id, yesterday);
  day = sqliteEntry.day;
  created_at = sqliteEntry.created_at;
  modified_at = sqliteEntry.modified_at;
  revision = sqliteEntry.revision;
  expect(sqliteEntry.content).toContain(text[1]);
  expect(sqliteEntry.content).toContain(text[3]);
  expect(sqliteEntry.sync_status).toBe('synced');
});

test('Relaunch 1 - Edited Yesterday is saved in Supabase', async () => {
  const supabaseEntry = await supabaseGetEntry(user_id, yesterday);
  expect(dayjs(day).isSame(supabaseEntry.day)).toBe(true);
  expect(dayjs(created_at).isSame(supabaseEntry.created_at)).toBe(true);
  expect(dayjs(modified_at).isSame(supabaseEntry.modified_at)).toBe(true);
  expect(revision == supabaseEntry.revision).toBe(true);
});
////////////////////////////////////////////////////
// 3rd launch
////////////////////////////////////////////////////

test('Relaunch 2 - delete local SQLite db', async () => {
  await appWindow.close();
  await pause(1000);
  await sqliteDeleteDB(userData);
  const startAppResponse = await startApp();
  appWindow = startAppResponse.appWindow;
  appInfo = startAppResponse.appInfo;
  electronApp = startAppResponse.electronApp;
});

test('Relaunch 2 - Today renders content and is focused', async () => {
  await expect(
    appWindow.locator(`[id='${today}-entry']`).getByRole('textbox').first()
  ).toBeFocused();
  await expect(appWindow.getByText(text[0])).toBeVisible();
});

test('Relaunch 2 - open calendar and go to yesterday', async () => {
  await appWindow.getByTestId('calendar-toggle').click();
  await pause(500);
  await appWindow.locator(`[id='${yesterday}-calendar']`).click();
});

test('Relaunch 2 - Yesterday renders content and is focused', async () => {
  await expect(
    appWindow.locator(`[id='${yesterday}-entry']`).getByRole('textbox').first()
  ).toBeFocused();
  await expect(appWindow.getByText(text[1])).toBeVisible();
});

////////////////////////////////////////////////////
// New day overnight
////////////////////////////////////////////////////

test('New Today renders after midnight', async () => {
  await electronApp.evaluate(({ ipcMain }) => {
    const date = new Date(Date.now() + 3600 * 1000 * 24).valueOf();
    ipcMain.emit('test-set-date', date);
  });
  await expect(
    appWindow.locator(`[id='${fakeToday}-entry']`).getByRole('textbox').first()
  ).toBeFocused();
  await pause(1000);
});

test('New Today typing works', async () => {
  await appWindow.keyboard.type(text[4], { delay: 50 });
  await expect(appWindow.getByText(text[0])).toBeVisible();
});

test('New Today entry is saved in SQLite', async () => {
  const sqliteEntry = await sqliteGetDB(userData, user_id, fakeToday);
  day = sqliteEntry.day;
  created_at = sqliteEntry.created_at;
  modified_at = sqliteEntry.modified_at;
  revision = sqliteEntry.revision;
  expect(sqliteEntry.content).toContain(text[4]);
  expect(sqliteEntry.sync_status).toBe('synced');
});

test('New Today entry is saved in Supabase', async () => {
  const supabaseEntry = await supabaseGetEntry(user_id, fakeToday);
  expect(dayjs(day).isSame(supabaseEntry.day)).toBe(true);
  expect(dayjs(created_at).isSame(supabaseEntry.created_at)).toBe(true);
  expect(dayjs(modified_at).isSame(supabaseEntry.modified_at)).toBe(true);
  expect(revision == supabaseEntry.revision).toBe(true);
});
////////////////////////////////////////////////////
// The end
////////////////////////////////////////////////////

test('Logout', async () => {
  await sqliteCreateCopyDB(userData, email);
  await appWindow.getByTestId('menu-main').click();
  await pause(1000);
  await appWindow.getByTestId('menu-main-logout').click();
});

test.afterAll(async () => {
  // await appWindow.screenshot({ path: 'screenshots/final-screen.png' })
  await appWindow.screenshot({
    path: getRecordingPath(appInfo.platform, 'final-screen.png'),
  });
  await appWindow.context().close();
  await appWindow.close();
  await electronApp.close();
  await supabaseDeleteUser(user_id);
  await sqliteDeleteDB(userData);
});
