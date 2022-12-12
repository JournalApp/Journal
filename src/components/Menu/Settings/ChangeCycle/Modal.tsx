import React, { useState, useEffect, useRef } from 'react'
import { theme, getCSSVar } from 'themes'
import { useForm, Controller, SubmitHandler } from 'react-hook-form'
import { isDev, logger, getZipRegexByCountry } from 'utils'
import * as Const from 'consts'
import { useQuery } from '@tanstack/react-query'
import { displayAmount } from 'utils'
import { PaymentIntent } from '@stripe/stripe-js'
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import Select from 'react-select'
import type { Countries, BillingInfo, Price } from 'types'
import { useUserContext } from 'context'
import Stripe from 'stripe'
import {
  getSubscription,
  calcYearlyPlanSavings,
  previewInvoice,
  updateSubscriptionToYearly,
} from '../../../../context/UserContext/subscriptions'
import {
  ButtonStyled,
  TextStyled,
  RowStyled,
  CellStyled,
  CellFillStyled,
  TableStyled,
  Divider,
  FormStyled,
} from './styled'
import {
  LabelStyled,
  AddressInputStyled,
  CardElementStyled,
  AddressStyled,
  AddressInputsStyled,
  AddressRowStyled,
  ErrorStyled,
  InputContainerStyled,
  getCustomStyles,
  IconCloseStyled,
  IconChevronStyled,
} from '../styled'
import { Success } from './Success'
import { LeftPanel } from './LeftPanel'
import { PaymentMethod } from './../Billing/PaymentMethod'
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton'

interface ChangeCycleProps {
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  billingInfo: BillingInfo
  billingInfoIsLoading: boolean
  prices: Price[]
}

type FormData = {
  billingInterval: { value: 'year' | 'month'; label: string }
  name: string
  country: { value: string; label: string }
  address: string
  city: string
  zip: string
  state: string
  cardElement: any
}

////////////////////////////////
// 🍔 ChangeCycle Modal component
////////////////////////////////

const Modal = ({ setOpen, prices, billingInfo, billingInfoIsLoading }: ChangeCycleProps) => {
  logger('ChangeCycle Modal rerender')
  const [formProcessing, setFormProcessing] = useState(false)
  const [poolingSubscription, setPoolingSubscription] = useState(false)
  const [messages, setMessages] = useState('')
  const [success, setSuccess] = useState(false)
  const [subscriptionUpdated, setSubscriptionUpdated] = useState(false)
  const { session, subscription, createSubscription } = useUserContext()
  const stripe = useStripe()

  useQuery({
    queryKey: ['subscription', session?.user.id],
    queryFn: async () => {
      setPoolingSubscription(true)
      logger('setPoolingSubscription(true)')
      return await getSubscription(session?.user.id, session.access_token)
    },
    refetchInterval: (data) => {
      if (data?.status == 'active' && data?.prices?.interval == 'year') {
        logger('Active yearly subscription received!')
        setPoolingSubscription(false)
        setSuccess(true)
        return false
      } else {
        return 2000
      }
    },
    refetchIntervalInBackground: true,
    enabled: subscriptionUpdated,
  })

  const { data: invoicePreview, isLoading } = useQuery({
    queryKey: ['invoicePreview'],
    queryFn: async () => {
      return await previewInvoice({ access_token: session.access_token })
    },
  })

  useEffect(() => {
    if (messages) {
      window.electronAPI.capture({
        distinctId: session.user.id,
        event: 'settings billing plan upgrade-to-yearly error',
        properties: { message: messages },
      })
    }
  }, [messages])

  useEffect(() => {
    if (success) {
      window.electronAPI.capture({
        distinctId: session.user.id,
        event: 'settings billing plan upgrade-to-yearly success',
      })
    }
  }, [success])

  const savings = prices
    ? calcYearlyPlanSavings(prices.filter((price) => price.product_id == Const.productWriterId))
    : ''

  const yearlyPrice = prices
    ? prices.filter(
        (price) => price.product_id == Const.productWriterId && price.interval == 'year'
      )[0]?.unit_amount
    : 0

  const productName = prices
    ? prices.filter((price) => price.product_id == Const.productWriterId)[0]?.products.name
    : ''

  const { handleSubmit } = useForm<FormData>()

  //////////////////////////
  // 💸 Submit form
  //////////////////////////

  const submitCheckout: SubmitHandler<FormData> = async (data) => {
    if (formProcessing) {
      return
    }
    setFormProcessing(true)
    try {
      const { clientSecret } = await updateSubscriptionToYearly({
        access_token: session.access_token,
        subscriptionId: subscription.id,
      })

      if (clientSecret) {
        // Create payment using clientSecret
        // if clientSecret is empty, stripe didn't create a invoice
        let { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: billingInfo?.card?.id,
        })
        if (error) {
          setFormProcessing(false)
          throw error
        }
      }
      setSubscriptionUpdated(true)
    } catch (err) {
      logger(err)
      setFormProcessing(false)
      setMessages('There was an error when changing to yearly')
    }
  }

  const submitButtonText = () => {
    if (poolingSubscription) {
      return 'Finalizing...'
    } else if (formProcessing) {
      return 'Processing...'
    } else {
      return 'Change to yearly'
    }
  }

  //////////////////////////
  // 🚀 Return
  //////////////////////////

  return (
    <>
      <IconCloseStyled onClick={() => setOpen(false)} />
      {success ? (
        <Success />
      ) : (
        <>
          <LeftPanel saving={savings} />
          <SkeletonTheme baseColor={theme('color.popper.pure', 0.6)} enableAnimation={false}>
            <FormStyled onSubmit={handleSubmit(submitCheckout)}>
              <AddressStyled>
                <TableStyled>
                  <RowStyled padding='0 0 8px 0'>
                    <CellFillStyled opacity='1'>
                      <em>{productName}</em>
                      <br />
                      {displayAmount(yearlyPrice)} / year
                    </CellFillStyled>
                    <CellStyled>{displayAmount(yearlyPrice)}</CellStyled>
                  </RowStyled>
                  <RowStyled>
                    <CellFillStyled>Current plan refund</CellFillStyled>
                    <CellStyled>
                      {isLoading ? (
                        <Skeleton width='50px' />
                      ) : (
                        displayAmount(invoicePreview.lines.data[0].amount)
                      )}
                    </CellStyled>
                  </RowStyled>
                  <RowStyled>
                    <CellFillStyled>Applied balance</CellFillStyled>
                    <CellStyled>
                      {isLoading ? (
                        <Skeleton width='50px' />
                      ) : (
                        displayAmount(
                          invoicePreview.starting_balance - invoicePreview.ending_balance
                        )
                      )}
                    </CellStyled>
                  </RowStyled>
                  <Divider />
                  <RowStyled>
                    <CellFillStyled>Total</CellFillStyled>
                    <CellStyled>
                      <em>
                        {isLoading ? (
                          <Skeleton width='50px' />
                        ) : (
                          displayAmount(invoicePreview.amount_due)
                        )}
                      </em>
                    </CellStyled>
                  </RowStyled>
                </TableStyled>
              </AddressStyled>
              {isLoading ? (
                <Skeleton />
              ) : (
                invoicePreview.amount_due > 0 && (
                  <PaymentMethod
                    billingInfo={billingInfo}
                    isLoading={billingInfoIsLoading}
                    showCardOnly={true}
                  />
                )
              )}

              <ButtonStyled
                type='submit'
                disabled={formProcessing || poolingSubscription || isLoading}
              >
                {submitButtonText()}
              </ButtonStyled>
              {messages && <ErrorStyled>{messages}</ErrorStyled>}
            </FormStyled>
          </SkeletonTheme>
        </>
      )}
    </>
  )
}

export { Modal }
