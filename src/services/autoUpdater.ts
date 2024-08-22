import { isDev, logger } from '../utils';
import { autoUpdater, ipcMain } from 'electron';
import log from 'electron-log';

if (!isDev()) {
  const server = 'https://desktop.journal.do';
  const updateUrl = `${server}/${process.platform}/${process.arch}/update.json`;
  logger(`updateUrl: ${updateUrl}`);
  log.info(`updateUrl: ${updateUrl}`);
  autoUpdater.setFeedURL({ url: updateUrl, serverType: 'json' });

  autoUpdater.on('update-available', () => {
    logger('update-available');
    log.info('update-available');
  });

  autoUpdater.on('update-not-available', () => {
    logger('update-not-available');
    log.info('update-not-available');
  });

  setInterval(() => {
    logger('autoUpdater.checkForUpdates()');
    log.info('autoUpdater.checkForUpdates()');
    autoUpdater.checkForUpdates();
  }, 5 * 60 * 1000);

  autoUpdater.checkForUpdates();

  ipcMain.on('electron-quit-and-install', () => {
    autoUpdater.quitAndInstall();
  });
}
