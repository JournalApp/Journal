import { isDev, logger } from '../utils'
import { ipcMain, app } from 'electron'
import fetch from 'node-fetch'

if (isDev()) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
  app.commandLine.appendSwitch('ignore-certificate-errors')
  app.commandLine.appendSwitch('allow-insecure-localhost', 'true')
}

interface EventMessage {
  distinctId: string
  event: string
  type?: 'event' | 'system' | 'error'
  properties?: Record<string | number, any>
}

const capture = async ({ distinctId, event, properties, type }: EventMessage) => {
  // if (!isDev()) {
  logger(`capture ${event}${type ? ' of type ' + type : ''}`)

  let appInfo = {
    version: app.getVersion(),
    platform: process.platform,
    arch: process.arch,
    locale: app.getLocale(),
  }

  try {
    const body = JSON.stringify({
      user_id: distinctId,
      app: appInfo,
      event,
      properties,
      ...(type && { type }),
    })
    const url = isDev() ? 'https://capture.journal.local' : 'https://capture.journal.do'
    // const url = 'https://capture.journal.do'
    const headers = { 'Content-Type': 'application/json', 'x-api-key': 'o4dqm2yb' }
    await fetch(url, { method: 'post', body, headers })
  } catch (error) {
    logger(`error`)
    logger(error)
  }
}

ipcMain.handle(
  'analytics-capture',
  async (e, { distinctId, event, properties, type }: EventMessage) => {
    capture({ distinctId, event, properties, type })
  }
)

ipcMain.handle(
  'analytics-capture-error',
  async (e, { distinctId, event, properties }: EventMessage) => {
    capture({ distinctId, event, properties })
  }
)

export { capture, EventMessage }
