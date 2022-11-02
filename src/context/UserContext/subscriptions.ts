import { isDev, logger } from 'utils'
import type { Subscription } from './types'

const getSubscription = async (access_token: string) => {
  logger('getSubscription')
  const url = isDev() ? 'https://s.journal.local' : 'https://s.journal.do'
  const response = await fetch(`${url}/api/v1/subscription`, {
    headers: { Authorization: `Bearer ${access_token}` },
  })
  const subscription = await response.json()
  logger('getSubscription response:')
  logger(subscription)
  return subscription as Subscription
}

export { getSubscription }
