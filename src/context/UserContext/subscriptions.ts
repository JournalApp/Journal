import { isDev, logger, supabase } from 'utils'
import type {
  Subscription,
  CreateSubscriptionProps,
  CancelSubscriptionProps,
  AddCardProps,
  BillingInfo,
  Countries,
  Price,
} from 'types'
import Stripe from 'stripe'

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
      ...(address && { address }),
    }),
  }).then((r) => r.json())
  return { subscriptionId, clientSecret }
}

const cancelSubscription = async ({ access_token, subscriptionId }: CancelSubscriptionProps) => {
  logger('cancelSubscription')
  const url = isDev() ? 'https://s.journal.local' : 'https://s.journal.do'
  await fetch(`${url}/api/v1/subscription/${subscriptionId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${access_token}`,
    },
  })
}

const resumeSubscription = async ({ access_token, subscriptionId }: CancelSubscriptionProps) => {
  logger('cancelSubscription')
  const url = isDev() ? 'https://s.journal.local' : 'https://s.journal.do'
  await fetch(`${url}/api/v1/subscription/${subscriptionId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${access_token}`,
    },
    body: JSON.stringify({
      action: 'resume',
    }),
  })
}

const createSetupIntent = async ({ access_token, address }: AddCardProps) => {
  logger('createSetupIntent')
  const url = isDev() ? 'https://s.journal.local' : 'https://s.journal.do'
  const { clientSecret } = await fetch(`${url}/api/v1/setupintent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${access_token}`,
    },
    body: JSON.stringify({
      address,
    }),
  }).then((r) => r.json())
  return { clientSecret }
}

const fetchCountries = async () => {
  const { data, error } = await supabase.from<Countries>('countries').select()
  if (error) {
    throw new Error(error.message)
  }
  // await awaitTimeout(5000)
  const options = data.map((country) => {
    return { value: country.country_code, label: country.country_name }
  })
  return options
}

const calcYearlyPlanSavings = (prices: Price[]) => {
  const yearlyPrice = prices
    ? prices.filter((price) => price.interval == 'year')[0]?.unit_amount
    : 0
  const monthlyPrice = prices
    ? prices.filter((price) => price.interval == 'month')[0]?.unit_amount
    : 0

  const percent = (1 - yearlyPrice / (monthlyPrice * 12)) * 100
  return `${Math.round(percent)}%`
}

const fetchProducts = async () => {
  const { data, error } = await supabase.from<Price>('prices').select('*,  products(*)')
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export {
  getSubscription,
  createSubscription,
  cancelSubscription,
  resumeSubscription,
  getCustomer,
  createSetupIntent,
  fetchCountries,
  calcYearlyPlanSavings,
  fetchProducts,
}
