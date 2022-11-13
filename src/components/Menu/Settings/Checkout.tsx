import React, { useState, useEffect, useRef } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import styled from 'styled-components'
import { theme } from 'themes'
import { isDev, logger } from 'utils'
import { UpgradeTabContent } from './Upgrade'
import {
  useFloating,
  offset,
  FloatingTree,
  FloatingOverlay,
  useListNavigation,
  useInteractions,
  useDismiss,
  useId,
  useClick,
  useRole,
  FloatingFocusManager,
  useFocus,
  useFloatingNodeId,
  useFloatingParentNodeId,
  FloatingNode,
  FloatingPortal,
  useFloatingTree,
} from '@floating-ui/react-dom-interactions'
import { useQuery } from '@tanstack/react-query'
import { loadStripe, PaymentIntent, Stripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
interface CheckoutProps {
  renderTrigger: any
}

const Checkout = ({ renderTrigger }: CheckoutProps) => {
  logger('Checkout rerender')
  const [open, setOpen] = useState(false)
  const nodeId = useFloatingNodeId()
  const [stripePromise, setStripePromise] = useState<Promise<Stripe> | null>(null)
  const [prices, setPrices] = useState([])
  const [subscriptionData, setSubscriptionData] = useState(null)
  const [messages, _setMessages] = useState('')
  const { isLoading, isError, data, error } = useQuery({
    queryKey: ['stripePromise'],
    queryFn: async () => {
      const url = isDev() ? 'https://s.journal.local' : 'https://s.journal.do'
      const { publishableKey, prices } = await fetch(`${url}/api/v1/config`).then((r) => r.json())
      setPrices(prices)
      setStripePromise(loadStripe(publishableKey))
      return publishableKey
    },
  })

  const { reference, floating, context, refs } = useFloating({
    open,
    onOpenChange: setOpen,
    nodeId,
  })

  const { getReferenceProps, getFloatingProps } = useInteractions([
    useClick(context),
    useDismiss(context, {
      escapeKey: false,
    }),
  ])

  const handleCloseEsc = (e: any) => {
    if (e.key == 'Escape') {
      if (refs.floating.current && refs.floating.current.contains(document.activeElement)) {
        setOpen(false)
      }
    }
  }

  useEffect(() => {
    logger('✅ addEventListener')
    document.addEventListener('keydown', handleCloseEsc)
    return () => {
      logger('❌ removeEventListener')
      document.removeEventListener('keydown', handleCloseEsc)
    }
  }, [])

  // helper for displaying status messages.
  const setMessage = (message: string) => {
    _setMessages(`${messages}\n\n${message}`)
  }

  const handleSubmit = async (e: any) => {
    // e.preventDefault()
    // // Get a reference to a mounted CardElement. Elements knows how
    // // to find your CardElement because there can only ever be one of
    // // each type of element.
    // const cardElement = elements.getElement(CardElement)
    // // Use card Element to tokenize payment details
    // let { error, paymentIntent } = await stripe.confirmCardPayment(subscriptionData.clientSecret, {
    //   payment_method: {
    //     card: cardElement,
    //     billing_details: {
    //       name: name,
    //     },
    //   },
    // })
    // if (error) {
    //   // show error and collect new card details.
    //   setMessage(error.message)
    //   return
    // }
    // setPaymentIntent(paymentIntent)
  }

  return (
    <FloatingNode id={nodeId}>
      {renderTrigger({ close: () => setOpen(false), ref: reference, ...getReferenceProps() })}
      <FloatingPortal>
        {open && (
          <FloatingOverlay
            lockScroll
            style={{
              display: 'grid',
              placeItems: 'center',
              background: theme('color.primary.surface', 0.8),
              zIndex: 1010,
            }}
          >
            <FloatingFocusManager context={context}>
              <div ref={floating} {...getFloatingProps()}>
                {stripePromise && (
                  <Elements stripe={stripePromise}>
                    Checkout
                    <button onClick={() => setOpen(false)}>Close</button>
                    <form onSubmit={handleSubmit}>
                      <label>
                        Full name
                        <input
                          type='text'
                          id='name'
                          // value={name}
                          // onChange={(e) => setName(e.target.value)}
                        />
                      </label>
                      <CardElement />
                      <button>Subscribe</button>
                      <div>{messages}</div>
                    </form>
                  </Elements>
                )}
              </div>
            </FloatingFocusManager>
          </FloatingOverlay>
        )}
      </FloatingPortal>
    </FloatingNode>
  )
}

export { Checkout }
