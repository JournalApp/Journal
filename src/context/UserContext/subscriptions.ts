import { isDev, logger } from 'utils'
import type { Subscription } from 'types'

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

const createSubscription = async (user_id: string, access_token: string, priceId: string) => {
  logger('createSubscription')
  const url = isDev() ? 'https://s.journal.local' : 'https://s.journal.do'
  const { subscriptionId, clientSecret } = await fetch(`${url}/api/v1/subscription`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${access_token}`,
    },
    body: JSON.stringify({
      priceId,
    }),
  }).then((r) => r.json())
  return { subscriptionId, clientSecret }
}

export { getSubscription, createSubscription }
