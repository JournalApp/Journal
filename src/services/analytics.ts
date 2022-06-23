import PostHog, { EventMessage } from 'posthog-node'
import { isDev, logger } from '../utils'
import { ipcMain } from 'electron'

const client = new PostHog('phc_71spBFzoqqePdAa4wpRxNAMxdkMyKdwHkdeMvnQ6wup', {
  host: 'https://app.posthog.com',
})

const capture = ({ distinctId, event, properties }: EventMessage) => {
  try {
    client.capture({
      distinctId,
      event,
      properties,
    })
  } catch (error) {
    logger(`error`)
    logger(error)
  }
}

ipcMain.handle('analytics-capture', async (e, { distinctId, event, properties }: EventMessage) => {
  logger('analytics-capture')
  try {
    client.capture({
      distinctId,
      event,
      properties,
    })
  } catch (error) {
    logger(`error`)
    logger(error)
  }
})

export { capture, client }
