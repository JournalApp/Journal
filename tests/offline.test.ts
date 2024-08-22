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
const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
const beforeYesterday = dayjs().subtract(2, 'day').format('YYYY-MM-DD');
// let text = faker.random.words(10).split(' ')
const text = [
  faker.lorem.sentence(),
  faker.lorem.sentence(),
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

test('Go offline, add entry beforeYesterday', async () => {
  await appWindow.context().setOffline(true);
  await appWindow.getByTestId('calendar-toggle').click();
  await pause(500);
  await appWindow.locator(`[id='${beforeYesterday}-calendar']`).click();
  await expect(
    appWindow.locator(`[id='${beforeYesterday}-entry']`).getByRole('textbox').first()
  ).toBeFocused();
});

test('BeforeYesterday typing works', async () => {
  await appWindow.keyboard.type(text[4], { delay: 50 });
  await expect(appWindow.getByText(text[4])).toBeVisible();
});

test('BeforeYesterday entry is saved as pending_insert in SQLite', async () => {
  const sqliteEntry = await sqliteGetDB(userData, user_id, beforeYesterday);
  expect(sqliteEntry.content).toContain(text[4]);
  expect(sqliteEntry.sync_status).toBe('pending_insert');
});

test('Go online, BeforeYesterday entry is saved as synced in SQLite', async () => {
  await appWindow.context().setOffline(false);
  await pause(8000);
  const sqliteEntry = await sqliteGetDB(userData, user_id, beforeYesterday);
  expect(sqliteEntry.content).toContain(text[4]);
  expect(sqliteEntry.sync_status).toBe('synced');
});

test('Go offline, edit entry beforeYesterday', async () => {
  await appWindow.context().setOffline(true);
  await pause(500);
  await appWindow.keyboard.press('Enter');
  await pause(100);
  await appWindow.keyboard.press('Enter');
  await pause(100);
  await appWindow.keyboard.press('ArrowUp');
  await pause(100);
  await appWindow.keyboard.press('ArrowUp');
  await pause(100);
  await appWindow.keyboard.type(text[5], { delay: 50 });
});

test('BeforeYesterday entry is saved as pending_update in SQLite', async () => {
  const sqliteEntry = await sqliteGetDB(userData, user_id, beforeYesterday);
  expect(sqliteEntry.content).toContain(text[4]);
  expect(sqliteEntry.content).toContain(text[5]);
  expect(sqliteEntry.sync_status).toBe('pending_update');
});

test('Remove BeforeYesterday', async () => {
  await appWindow.getByTestId('calendar-toggle').click();
  await pause(500);
  await appWindow.getByTestId(`menu-day-${beforeYesterday}`).click();
  await pause(200);
  await appWindow.getByTestId(`menu-day-${beforeYesterday}-remove`).click();
  await pause(200);
  await appWindow.keyboard.press('Tab');
  await pause(200);
  await appWindow.keyboard.press('Enter');
});

test('BeforeYesterday is not rendered', async () => {
  await expect(appWindow.getByText(text[4])).toHaveCount(0);
  await expect(appWindow.getByText(text[5])).toHaveCount(0);
});

test('BeforeYesterday entry is saved as pending_delete in SQLite', async () => {
  const sqliteEntry = await sqliteGetDB(userData, user_id, beforeYesterday);
  expect(sqliteEntry.content).toContain(text[4]);
  expect(sqliteEntry.content).toContain(text[5]);
  expect(sqliteEntry.sync_status).toBe('pending_delete');
});

test('Re-add entry beforeYesterday', async () => {
  await appWindow.getByTestId('calendar-toggle').click();
  await pause(500);
  await appWindow.locator(`[id='${beforeYesterday}-calendar']`).click();
  await expect(
    appWindow.locator(`[id='${beforeYesterday}-entry']`).getByRole('textbox').first()
  ).toBeFocused();
});

test('Re-added BeforeYesterday typing works', async () => {
  await appWindow.keyboard.type(text[6], { delay: 50 });
  await expect(appWindow.getByText(text[6])).toBeVisible();
});

test('Re-added BeforeYesterday entry is saved as pending_update in SQLite', async () => {
  const sqliteEntry = await sqliteGetDB(userData, user_id, beforeYesterday);
  expect(sqliteEntry.content).toContain(text[6]);
  expect(sqliteEntry.sync_status).toBe('pending_update');
});

test('Go online, BeforeYesterday entry is saved as synced from SQLite', async () => {
  await appWindow.context().setOffline(false);
  await pause(8000);
  const sqliteEntry = await sqliteGetDB(userData, user_id, beforeYesterday);
  expect(sqliteEntry.content).toContain(text[6]);
  expect(sqliteEntry.sync_status).toBe('synced');
  await appWindow.getByTestId('calendar-toggle').click();
});

////////////////////////////////////////////////////
// 2nd launch (offline)
////////////////////////////////////////////////////

test('Relaunch 1 (offline)', async () => {
  await appWindow.close();
  const startAppResponse = await startApp(true);
  appWindow = startAppResponse.appWindow;
  appInfo = startAppResponse.appInfo;
  electronApp = startAppResponse.electronApp;
});

test('Relaunch 1 - Add new day', async () => {
  await appWindow.getByTestId('calendar-toggle').click();
  await pause(500);
  await appWindow.locator(`[id='${yesterday}-calendar']`).click();
  await expect(
    appWindow.locator(`[id='${yesterday}-entry']`).getByRole('textbox').first()
  ).toBeFocused();
});

test('Relaunch 1 - Yesterday typing works', async () => {
  await appWindow.keyboard.type(text[1], { delay: 50 });
  await expect(appWindow.getByText(text[1])).toBeVisible();
});

test('Relaunch 1 - Yesterday entry is saved as pending_insert in SQLite', async () => {
  const sqliteEntry = await sqliteGetDB(userData, user_id, yesterday);
  expect(sqliteEntry.content).toContain(text[1]);
  expect(sqliteEntry.sync_status).toBe('pending_insert');
});

////////////////////////////////////////////////////
// 3rd launch (online)
////////////////////////////////////////////////////

test('Relaunch 2 (online)', async () => {
  await appWindow.close();
  const startAppResponse = await startApp();
  appWindow = startAppResponse.appWindow;
  appInfo = startAppResponse.appInfo;
  electronApp = startAppResponse.electronApp;
});

test('Relaunch 2 - Yesterday entry rendered', async () => {
  await appWindow.locator(`[id='${yesterday}-calendar']`).click();
  await expect(appWindow.getByText(text[1])).toBeVisible();
});

test('Relaunch 2 - Yesterday entry is saved as synced in SQLite', async () => {
  const sqliteEntry = await sqliteGetDB(userData, user_id, yesterday);
  day = sqliteEntry.day;
  created_at = sqliteEntry.created_at;
  modified_at = sqliteEntry.modified_at;
  revision = sqliteEntry.revision;
  expect(sqliteEntry.content).toContain(text[1]);
  expect(sqliteEntry.sync_status).toBe('synced');
});

test('Relaunch 2 - Yesterday entry is saved in Supabase', async () => {
  const supabaseEntry = await supabaseGetEntry(user_id, yesterday);
  expect(dayjs(day).isSame(supabaseEntry.day)).toBe(true);
  expect(dayjs(created_at).isSame(supabaseEntry.created_at)).toBe(true);
  expect(dayjs(modified_at).isSame(supabaseEntry.modified_at)).toBe(true);
  expect(revision == supabaseEntry.revision).toBe(true);
});

////////////////////////////////////////////////////
// 4th launch (offline)
// Edit entry and check if is pending_update
////////////////////////////////////////////////////

test('Relaunch 3 (offline)', async () => {
  await appWindow.close();
  const startAppResponse = await startApp(true);
  appWindow = startAppResponse.appWindow;
  appInfo = startAppResponse.appInfo;
  electronApp = startAppResponse.electronApp;
});

test('Relaunch 3 - Editing Today entry works', async () => {
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

test('Relaunch 3 - Today entry is saved as pending_update in SQLite', async () => {
  const sqliteEntry = await sqliteGetDB(userData, user_id, today);
  expect(sqliteEntry.content).toContain(text[0]);
  expect(sqliteEntry.content).toContain(text[2]);
  expect(sqliteEntry.sync_status).toBe('pending_update');
});

test('Relaunch 4 (online)', async () => {
  await appWindow.close();
  const startAppResponse = await startApp();
  appWindow = startAppResponse.appWindow;
  appInfo = startAppResponse.appInfo;
  electronApp = startAppResponse.electronApp;
});

test('Relaunch 4 - Today entry is saved as synced in SQLite', async () => {
  const sqliteEntry = await sqliteGetDB(userData, user_id, today);
  day = sqliteEntry.day;
  created_at = sqliteEntry.created_at;
  modified_at = sqliteEntry.modified_at;
  revision = sqliteEntry.revision;
  expect(sqliteEntry.content).toContain(text[0]);
  expect(sqliteEntry.content).toContain(text[2]);
  expect(sqliteEntry.sync_status).toBe('synced');
});

test('Relaunch 4 - Today entry is saved in Supabase', async () => {
  const supabaseEntry = await supabaseGetEntry(user_id, today);
  expect(dayjs(day).isSame(supabaseEntry.day)).toBe(true);
  expect(dayjs(created_at).isSame(supabaseEntry.created_at)).toBe(true);
  expect(dayjs(modified_at).isSame(supabaseEntry.modified_at)).toBe(true);
  expect(revision == supabaseEntry.revision).toBe(true);
});

////////////////////////////////////////////////////
// Delete entry and check if is pending_delete
////////////////////////////////////////////////////

test('Relaunch 5 (offline)', async () => {
  await appWindow.close();
  const startAppResponse = await startApp(true);
  appWindow = startAppResponse.appWindow;
  appInfo = startAppResponse.appInfo;
  electronApp = startAppResponse.electronApp;
});

test('Relaunch 5 - yesterday is visibe', async () => {
  await appWindow.locator(`[id='${yesterday}-calendar']`).click();
  await pause(200);
  await expect(appWindow.getByText(text[1])).toBeVisible();
});

test('Relaunch 5 - Remove yesterday', async () => {
  await appWindow.getByTestId('calendar-toggle').click();
  await pause(500);
  await appWindow.getByTestId(`menu-day-${yesterday}`).click();
  await pause(200);
  await appWindow.getByTestId(`menu-day-${yesterday}-remove`).click();
  await pause(200);
  await appWindow.keyboard.press('Tab');
  await pause(200);
  await appWindow.keyboard.press('Enter');
});

test('Relaunch 5 - yesterday is not rendered', async () => {
  await expect(appWindow.getByText(text[1])).toHaveCount(0);
});

test('Relaunch 5 - yesterday entry is saved as pending_delete in SQLite', async () => {
  const sqliteEntry = await sqliteGetDB(userData, user_id, yesterday);
  expect(sqliteEntry.content).toContain(text[1]);
  expect(sqliteEntry.sync_status).toBe('pending_delete');
});

test('Relaunch 6 (online)', async () => {
  await appWindow.close();
  const startAppResponse = await startApp();
  appWindow = startAppResponse.appWindow;
  appInfo = startAppResponse.appInfo;
  electronApp = startAppResponse.electronApp;
});

test('Relaunch 6 - yesterday is removed from SQLite', async () => {
  const sqliteEntry = await sqliteGetDB(userData, user_id, yesterday);
  expect(sqliteEntry).toBeFalsy();
});

test('Relaunch 6 - Today entry is saved in Supabase', async () => {
  const supabaseEntry = await supabaseGetEntry(user_id, yesterday);
  expect(supabaseEntry).toBeFalsy();
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
