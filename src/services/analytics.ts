import PostHog, { EventMessage } from 'posthog-node'
import { isDev } from '../utils/misc'
import { ipcMain } from 'electron'

const client = new PostHog('phc_71spBFzoqqePdAa4wpRxNAMxdkMyKdwHkdeMvnQ6wup', {
  host: 'https://app.posthog.com',
})

const capture = ({ distinctId, event, properties }: EventMessage) => {
  client.capture({
    distinctId,
    event,
    properties,
  })
}

ipcMain.handle('analytics-capture', async (e, { distinctId, event, properties }: EventMessage) => {
  console.log('analytics-capture')
  try {
    client.capture({
      distinctId,
      event,
      properties,
    })
  } catch (error) {
    console.log(`error`)
    console.log(error)
  }
})

export { capture, client }
