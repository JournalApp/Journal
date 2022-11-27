import { isDev, logger } from 'utils'
import type { Subscription, CreateSubscriptionProps, CancelSubscriptionProps } from 'types'
import Stripe from 'stripe'
import { BillingInfo } from 'types'

const getCustomer = async (access_token: string) => {
  logger('getCustomer')
  const url = isDev() ? 'https://s.journal.local' : 'https://s.journal.do'
  return (await fetch(`${url}/api/v1/customer`, {
    headers: { Authorization: `Bearer ${access_token}` },
  }).then((r) => r.json())) as BillingInfo
}

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

const cancelSubscription = async ({ access_token, subscriptionId }: CancelSubscriptionProps) => {
  logger('cancelSubscription')
  const url = isDev() ? 'https://s.journal.local' : 'https://s.journal.do'
  await fetch(`${url}/api/v1/subscription`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${access_token}`,
    },
    body: JSON.stringify({
      subscriptionId,
    }),
  }).then((r) => r.json())
  return true
}

export { getSubscription, createSubscription, cancelSubscription, getCustomer }
