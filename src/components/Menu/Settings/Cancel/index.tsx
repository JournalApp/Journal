import React, { useState, useEffect, useRef } from 'react'
import { theme, getCSSVar } from 'themes'
import { logger, supabase, getZipRegexByCountry, isDev, awaitTimeout } from 'utils'
import * as Const from 'consts'
import {
  useFloating,
  FloatingOverlay,
  useInteractions,
  useDismiss,
  useClick,
  FloatingFocusManager,
  useFloatingNodeId,
  FloatingNode,
  FloatingPortal,
} from '@floating-ui/react-dom-interactions'
import { useQuery } from '@tanstack/react-query'
import { loadStripe, PaymentIntent } from '@stripe/stripe-js'
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import Select from 'react-select'
import type { Countries, Price } from 'types'
import { useUserContext } from 'context'
import Stripe from 'stripe'
import { cancelSubscription, getSubscription } from '../../../../context/UserContext/subscriptions'
import { IconCloseStyled, ModalStyled } from './styled'

interface CancelProps {
  renderTrigger: any
}

const Cancel = ({ renderTrigger }: CancelProps) => {
  logger('Checkout rerender')
  const { session, subscription } = useUserContext()
  const [isCanceling, setIsCanceling] = useState(false)
  const [isCanceled, setIsCanceled] = useState(false)
  const [poolingSubscription, setPoolingSubscription] = useState(false)
  const [success, setSuccess] = useState(false)
  const [open, setOpen] = useState(false)
  const nodeId = useFloatingNodeId()

  useQuery({
    queryKey: ['subscription', session?.user.id],
    queryFn: async () => {
      setPoolingSubscription(true)
      logger('setPoolingSubscription(true)')
      return await getSubscription(session?.user.id, session.access_token)
    },
    refetchInterval: (data) => {
      if (data?.status == 'active' && data?.cancel_at_period_end == true) {
        logger('Subscription with cancel_at_period_end received!')
        subscription.current = data
        setPoolingSubscription(false)
        setSuccess(true)
        return false
      } else {
        return 2000
      }
    },
    refetchIntervalInBackground: true,
    enabled: isCanceled,
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

  const cancel = async () => {
    setIsCanceling(true)
    try {
      await cancelSubscription({
        access_token: session.access_token,
        subscriptionId: subscription.current.id,
      })
      setIsCanceled(true)
      setIsCanceling(false)
    } catch {
      setIsCanceling(false)
      setIsCanceled(false)
    }
  }

  const cancelButtonText = () => {
    if (poolingSubscription) {
      return 'Finalizing...'
    } else if (isCanceling) {
      return 'Canceling...'
    } else {
      return 'Cancel'
    }
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
              <ModalStyled ref={floating} {...getFloatingProps()}>
                <IconCloseStyled onClick={() => setOpen(false)} />
                This is Cancel
                <button onClick={() => cancel()} disabled={poolingSubscription || isCanceling}>
                  {cancelButtonText()}
                </button>
                <button
                  onClick={() => setOpen(false)}
                  disabled={poolingSubscription || isCanceling}
                >
                  Close
                </button>
              </ModalStyled>
            </FloatingFocusManager>
          </FloatingOverlay>
        )}
      </FloatingPortal>
    </FloatingNode>
  )
}

export { Cancel }
