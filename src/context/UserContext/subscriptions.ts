import { isDev, logger } from 'utils'
import type { Subscription } from 'types'

// TODO save to SQLite and use as initial val

const getSubscription = async (user_id: string, access_token: string) => {
  logger('getSubscription')
  const url = isDev() ? 'https://s.journal.local' : 'https://s.journal.do'
  const response = await fetch(`${url}/api/v1/subscription`, {
    headers: { Authorization: `Bearer ${access_token}` },
  })
  const subscription = (await response.json()) as Subscription
  logger('getSubscription response:')
  logger(subscription)
  window.electronAPI.user.saveSubscription(user_id, subscription)
  return subscription
}

export { getSubscription }
