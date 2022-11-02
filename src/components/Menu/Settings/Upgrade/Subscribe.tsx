import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import type { PaymentIntent, Stripe } from '@stripe/stripe-js'

const Subscribe = ({ subscriptionData }: any) => {
  const [name, setName] = useState('Jenny Rosen')
  const [messages, _setMessages] = useState('')
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent>()
  const stripe = useStripe()
  const elements = useElements()

  // helper for displaying status messages.
  const setMessage = (message: string) => {
    _setMessages(`${messages}\n\n${message}`)
  }

  // When the subscribe-form is submitted we do a few things:
  //
  //   1. Tokenize the payment method
  //   2. Create the subscription
  //   3. Handle any next actions like 3D Secure that are required for SCA.
  const handleSubmit = async (e: any) => {
    e.preventDefault()

    // Get a reference to a mounted CardElement. Elements knows how
    // to find your CardElement because there can only ever be one of
    // each type of element.
    const cardElement = elements.getElement(CardElement)

    // Use card Element to tokenize payment details
    let { error, paymentIntent } = await stripe.confirmCardPayment(subscriptionData.clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: name,
        },
      },
    })

    if (error) {
      // show error and collect new card details.
      setMessage(error.message)
      return
    }
    setPaymentIntent(paymentIntent)
  }

  return (
    <>
      {paymentIntent && paymentIntent.status === 'succeeded' ? (
        <>
          <div>Payment successful!</div>
        </>
      ) : (
        <>
          <h1>Subscribe</h1>

          <p>
            Try the successful test card: <span>4242424242424242</span>.
          </p>

          <p>
            Try the test card that requires SCA: <span>4000002500003155</span>.
          </p>

          <p>
            Use any <i>future</i> expiry date, CVC,5 digit postal code
          </p>

          <hr />

          <form onSubmit={handleSubmit}>
            <label>
              Full name
              <input type='text' id='name' value={name} onChange={(e) => setName(e.target.value)} />
            </label>

            <CardElement />

            <button>Subscribe</button>

            <div>{messages}</div>
          </form>
        </>
      )}
    </>
  )
}

export { Subscribe }
