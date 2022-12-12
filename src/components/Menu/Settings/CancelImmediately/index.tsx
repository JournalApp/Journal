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
import { PaymentIntent } from '@stripe/stripe-js'
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import Select from 'react-select'
import type { Countries, Price } from 'types'
import { useUserContext } from 'context'
import Stripe from 'stripe'
import {
  cancelSubscriptionImmediately,
  getSubscription,
  resumeSubscription,
} from '../../../../context/UserContext/subscriptions'
import {
  IconCloseStyled,
  ModalStyled,
  ButtonDestructiveStyled,
  ButtonStyled,
  ButtonGhostStyled,
  TitleStyled,
  DescriptionStyled,
  ActionsWrapperStyled,
} from './styled'
import dayjs from 'dayjs'

interface CancelImmediatelyProps {
  renderTrigger: any
}

const CancelImmediately = ({ renderTrigger }: CancelImmediatelyProps) => {
  logger('CancelOrResume rerender')
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
      logger(data)
      if (data == null) {
        logger('Subscription cencelled!')
        setPoolingSubscription(false)
        setSuccess(true)
        return false
      } else {
        logger('Still there is a subscription...')
        return 2000
      }
    },
    refetchIntervalInBackground: true,
    enabled: isCanceled == true,
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

  useEffect(() => {
    if (success) {
      setOpen(false)
    }
  }, [success])

  const cancelOrResume = async () => {
    setIsCanceling(true)
    try {
      await cancelSubscriptionImmediately({
        access_token: session.access_token,
        subscriptionId: subscription.id,
      })

      setIsCanceled(true)
      setIsCanceling(false)
    } catch (error) {
      logger(error)
      setIsCanceling(false)
      setIsCanceled(false)
    }
  }

  const cancelButtonText = () => {
    if (success) {
      return 'Done'
    } else if (poolingSubscription) {
      return 'Finalizing...'
    } else if (isCanceling) {
      return 'Canceling...'
    } else {
      return 'Cancel plan'
    }
  }

  const setOpenHandler = () => {
    setOpen(true)
    window.electronAPI.capture({
      distinctId: session.user.id,
      event: 'settings billing plan',
      properties: { action: 'cancel-immediately' },
    })
  }

  return (
    <FloatingNode id={nodeId}>
      {renderTrigger({ open: () => setOpenHandler(), ref: reference, ...getReferenceProps() })}
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
            <FloatingFocusManager context={context} initialFocus={0}>
              <ModalStyled ref={floating} {...getFloatingProps()}>
                <TitleStyled>Oh no, cancel your plan?</TitleStyled>
                <DescriptionStyled>
                  If you proceed with canceling your plan, it will become inactive immediately.
                </DescriptionStyled>
                <ActionsWrapperStyled>
                  <ButtonDestructiveStyled
                    onClick={() => cancelOrResume()}
                    disabled={poolingSubscription || isCanceling}
                  >
                    {cancelButtonText()}
                  </ButtonDestructiveStyled>
                  <ButtonStyled
                    onClick={() => setOpen(false)}
                    disabled={poolingSubscription || isCanceling}
                  >
                    Keep plan
                  </ButtonStyled>
                </ActionsWrapperStyled>
              </ModalStyled>
            </FloatingFocusManager>
          </FloatingOverlay>
        )}
      </FloatingPortal>
    </FloatingNode>
  )
}

export { CancelImmediately }
