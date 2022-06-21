import { isDev } from '../utils/misc'
import { autoUpdater, ipcMain } from 'electron'
import log from 'electron-log'

if (!isDev()) {
  const server = 'https://desktop.journal.do'
  const updateUrl = `${server}/${process.platform}/${process.arch}/update.json`
  console.log(`updateUrl: ${updateUrl}`)
  log.info(`updateUrl: ${updateUrl}`)
  autoUpdater.setFeedURL({ url: updateUrl, serverType: 'json' })

  autoUpdater.on('update-available', () => {
    console.log('update-available')
    log.info('update-available')
  })

  autoUpdater.on('update-not-available', () => {
    console.log('update-not-available')
    log.info('update-not-available')
  })

  autoUpdater.on('error', (error) => {
    console.log('Error:')
    console.log(error)
    log.info('Error:')
    log.info(error)
  })

  setInterval(() => {
    console.log('autoUpdater.checkForUpdates()')
    log.info('autoUpdater.checkForUpdates()')
    autoUpdater.checkForUpdates()
  }, 60000)

  autoUpdater.checkForUpdates()

  ipcMain.on('electron-quit-and-install', () => {
    autoUpdater.quitAndInstall()
  })
}
