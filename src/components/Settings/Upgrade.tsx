import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { theme } from 'themes'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import { Subscribe } from './Subscribe'
import type { PaymentIntent, Stripe } from '@stripe/stripe-js'

const Upgrade = () => {
  const [prices, setPrices] = useState([])
  const [subscriptionData, setSubscriptionData] = useState(null)
  const [publishableKeyState, setPublishableKeyState] = useState<any>()

  useEffect(() => {
    const fetchPrices = async () => {
      const { publishableKey, prices } = await fetch(
        'https://subscriptions.journal.local/api/v1/config'
      ).then((r) => r.json())
      setPublishableKeyState(publishableKey)
      setPrices(prices)
    }
    fetchPrices()
  }, [])

  const createSubscription = async (priceId: string) => {
    const { subscriptionId, clientSecret } = await fetch(
      'https://subscriptions.journal.local/api/v1/create-subscription',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
        }),
      }
    ).then((r) => r.json())

    setSubscriptionData({ subscriptionId, clientSecret })
  }

  // if(subscriptionData) {
  //   return <Redirect to={{
  //     pathname: '/subscribe',
  //     state: subscriptionData
  //   }} />
  // }

  return (
    <>
      {prices && (
        <Elements stripe={loadStripe(publishableKeyState)}>
          {subscriptionData ? (
            <Subscribe subscriptionData={subscriptionData} />
          ) : (
            <div>
              <h1>Select a plan</h1>

              <div className='price-list'>
                {prices.map((price) => {
                  return (
                    <div key={price.id}>
                      <h3>{price.product.name}</h3>

                      <p>
                        ${price.unit_amount / 100} / {price.recurring.interval}
                      </p>

                      <button onClick={() => createSubscription(price.id)}>Select</button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </Elements>
      )}
    </>
  )
}

export { Upgrade }
