import { isDev, logger } from 'utils'
import type { Subscription, CreateSubscriptionProps } from 'types'
import Stripe from 'stripe'

const getSubscription = async (user_id: string, access_token: string) => {
  logger('getSubscription')
  const url = isDev() ? 'https://s.journal.local' : 'https://s.journal.do'
  const response = await fetch(`${url}/api/v1/subscription`, {
    headers: { Authorization: `Bearer ${access_token}` },
  })
  const subscription = await response.json()
  logger('getSubscription response:')
  if (Object.keys(subscription).length === 0) {
    logger('null')
    return null
  } else {
    logger(subscription)
    window.electronAPI.user.saveSubscription(user_id, subscription)
    return subscription as Subscription
  }
}

const createSubscription = async ({ access_token, priceId, address }: CreateSubscriptionProps) => {
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
      address,
    }),
  }).then((r) => r.json())
  return { subscriptionId, clientSecret }
}

export { getSubscription, createSubscription }
