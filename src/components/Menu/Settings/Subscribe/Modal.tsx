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
} from '../../../../context/UserContext/subscriptions'
import { ButtonStyled, TextStyled } from './styled'
import {
  LabelStyled,
  AddressInputStyled,
  FormStyled,
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

interface SubscribeProps {
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  prices: Price[]
  billingInterval: 'year' | 'month'
  billingInfo: BillingInfo
  billingInfoIsLoading: boolean
  countries: {
    value: string
    label: string
  }[]
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
// 🍔 Subscribe Modal component
////////////////////////////////

const Modal = ({
  setOpen,
  prices,
  billingInterval,
  billingInfo,
  billingInfoIsLoading,
  countries,
}: SubscribeProps) => {
  logger('Subscribe Modal rerender')
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null)
  const [cardElemetFocused, setCardElemetFocused] = useState(false)
  const [cardElemetReady, setCardElemetReady] = useState(false)
  const [cardElemetComplete, setCardElemetComplete] = useState(false)
  const [formProcessing, setFormProcessing] = useState(false)
  const [poolingSubscription, setPoolingSubscription] = useState(false)
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null)
  const [messages, setMessages] = useState('')
  const [success, setSuccess] = useState(false)
  const [isCardPayment, setIsCardPayment] = useState(true)
  const [subscriptionCreated, setSubscriptionCreated] = useState(false)
  const customStylesCardElement = useRef({})
  const { session, subscription, createSubscription } = useUserContext()

  useQuery({
    queryKey: ['subscription', session?.user.id],
    queryFn: async () => {
      setPoolingSubscription(true)
      logger('setPoolingSubscription(true)')
      return await getSubscription(session?.user.id, session.access_token)
    },
    refetchInterval: (data) => {
      if (data?.status == 'active' && data?.id == subscriptionId) {
        logger('Active subscription received!')
        setPoolingSubscription(false)
        setSuccess(true)
        return false
      } else {
        return 2000
      }
    },
    refetchIntervalInBackground: true,
    enabled: !!(paymentIntent?.status === 'succeeded' || subscriptionCreated),
  })

  interface PricingOption {
    value: 'year' | 'month'
    label: string
  }

  const savings = prices
    ? calcYearlyPlanSavings(prices.filter((price) => price.product_id == Const.productWriterId))
    : ''

  const yearlyPrice = prices
    ? prices.filter(
        (price) => price.product_id == Const.productWriterId && price.interval == 'year'
      )[0]?.unit_amount
    : 0
  const monthlyPrice = prices
    ? prices.filter(
        (price) => price.product_id == Const.productWriterId && price.interval == 'month'
      )[0]?.unit_amount
    : 0
  const billingIntervalOptions: PricingOption[] = [
    { value: 'year', label: `Yearly – $${yearlyPrice / 100} / year (save ${savings})` },
    { value: 'month', label: `Monthly – $${monthlyPrice / 100} / month` },
  ]

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    trigger,
    control,
    watch,
    formState: { errors },
  } = useForm<FormData>()

  const watchCountry = watch('country', {
    value: 'US',
    label: '',
  })
  const watchBillingInterval = watch(
    'billingInterval',
    billingIntervalOptions.find((price) => price.value == billingInterval)
  )

  // Initialize an instance of stripe.
  const stripe = useStripe()
  const elements = useElements()

  //////////////////////////
  // 🏓 useEffect
  //////////////////////////

  useEffect(() => {
    if (messages) {
      window.electronAPI.capture({
        distinctId: session.user.id,
        event: 'settings upgrade-form error',
        properties: { message: messages },
      })
    }
  }, [messages])

  useEffect(() => {
    if (success) {
      window.electronAPI.capture({
        distinctId: session.user.id,
        event: 'settings upgrade-form success',
      })
    }
  }, [success])

  useEffect(() => {
    setValue(
      'billingInterval',
      billingIntervalOptions.find((price) => price.value == billingInterval)
    )
  }, [billingInterval])

  useEffect(() => {
    if (billingInfo && prices) {
      let charge = prices.filter(
        (price) =>
          price.product_id == Const.productWriterId && price.interval == watchBillingInterval.value
      )[0].unit_amount
      let balance = billingInfo.customer.balance
      if (charge + balance <= 0) {
        setIsCardPayment(false)
      } else {
        setIsCardPayment(true)
      }
      logger(`To pay: ${(charge + balance) / 100}`)
    }
  }, [watchBillingInterval])

  useEffect(() => {
    if (getValues('zip')) {
      trigger('zip')
    }
  }, [watchCountry])

  useEffect(() => {
    if (billingInfo?.customer?.address?.country && countries) {
      setValue(
        'country',
        countries.find((country) => country.value == billingInfo.customer.address.country)
      )
    }
    if (billingInfo?.customer?.address?.city) {
      setValue('city', billingInfo.customer.address.city)
    }
    if (billingInfo?.customer?.address?.line1) {
      setValue('address', billingInfo.customer.address.line1)
    }
    if (billingInfo?.customer?.address?.postal_code) {
      setValue('zip', billingInfo.customer.address.postal_code)
    }
    if (billingInfo?.customer?.address?.state) {
      setValue('state', billingInfo.customer.address.state)
    }
    if (billingInfo?.card?.billing_details?.name) {
      setValue('name', billingInfo.card.billing_details.name)
    }
  }, [billingInfo])

  useEffect(() => {
    // Get css variable values to pass to sripe CardElement
    const styles = getComputedStyle(document.body)

    customStylesCardElement.current = {
      base: {
        color: `rgba(${styles.getPropertyValue(getCSSVar('color.popper.main'))},1)`,
        fontFamily: 'Inter, Inter var, Arial, Helvetica',
        fontSize: '14px',
        fontSmoothing: 'antialiased',
        '::placeholder': {
          color: `rgba(${styles.getPropertyValue(getCSSVar('color.popper.main'))},0.6)`,
        },
      },
      invalid: {
        color: `rgba(${styles.getPropertyValue(getCSSVar('color.error.main'))},1)`,
        iconColor: `rgba(${styles.getPropertyValue(getCSSVar('color.error.main'))},1)`,
      },
    }

    setValue(
      'billingInterval',
      billingIntervalOptions.find((price) => price.value == billingInterval)
    )
  }, [])

  //////////////////////////
  // 💸 Submit form
  //////////////////////////

  const submitCheckout: SubmitHandler<FormData> = async (data) => {
    if (formProcessing) {
      return
    }
    logger('Submitted data:')
    logger(data)
    if (!billingInfo.card) {
      if (!cardElemetComplete) {
        elements.getElement(CardElement).focus()
        return
      }
    }
    setFormProcessing(true)

    // 1. Create subscription and Save billing address to make stripe tax work
    let address: Stripe.Address | null = null
    if (isCardPayment && !billingInfo?.card) {
      address = {
        city: data.city,
        country: data.country.value,
        line1: data.address,
        line2: '',
        postal_code: data.zip,
        state: data.state,
      }
    }

    const { subscriptionId, clientSecret } = await createSubscription({
      access_token: session.access_token,
      priceId: prices.filter(
        (price) =>
          price.product_id == Const.productWriterId && price.interval == data.billingInterval.value
      )[0]?.id,
      ...(address && { address }),
    })

    if (subscriptionId) {
      setSubscriptionId(subscriptionId)
    } else {
      setMessages('There was an error processing your payment, please try again')
      setFormProcessing(false)
      return
    }

    if (isCardPayment) {
      if (clientSecret) {
        // 2. Create payment using clientSecret
        // if clientSecret is empty, stripe didn't create a invoice
        const cardElement = elements.getElement(CardElement)
        let { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: billingInfo?.card?.id || {
            card: cardElement,
            billing_details: {
              name: data.name,
            },
          },
        })
        if (error) {
          setMessages('There was an error processing your payment, please try again')
          setFormProcessing(false)
          return
        }
        setPaymentIntent(paymentIntent)
      } else {
        // TODO handle case for not reaching min charge amount
        // Charge is > 0, but stripe did not charge as charge is < $0.50
        // If card field was visible, save card for future use (SetupIntent)
        // For now, just don't save the card and set subs as created
        setSubscriptionCreated(true)
      }
    } else {
      setSubscriptionCreated(true)
    }
  }

  const submitButtonText = () => {
    if (poolingSubscription) {
      return 'Finalizing...'
    } else if (formProcessing) {
      return 'Processing...'
    } else {
      return (
        'Upgrade to Writer' +
        (prices
          ? ' - $' +
            prices.filter(
              (price) =>
                price.product_id == Const.productWriterId &&
                price.interval == watchBillingInterval?.value
            )[0]?.unit_amount /
              100
          : '')
      )
    }
  }

  const ChargeSummary = () => {
    const balance = billingInfo.customer.balance

    if (balance == 0) {
      return <></>
    }
    if (balance > 0) {
      return (
        <TextStyled>
          {`
          Card charge will be increased by your ${displayAmount(
            Math.abs(billingInfo.customer.balance)
          )} balance.`}
        </TextStyled>
      )
    }
    if (balance < 0) {
      const charge = prices.filter(
        (price) =>
          price.product_id == Const.productWriterId && price.interval == watchBillingInterval?.value
      )[0]?.unit_amount
      return (
        <TextStyled>{`${displayAmount(
          Math.min(-balance, charge)
        )} will be used from your balance.`}</TextStyled>
      )
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
          <LeftPanel />
          <SkeletonTheme baseColor={theme('color.popper.pure', 0.6)} enableAnimation={false}>
            <FormStyled onSubmit={handleSubmit(submitCheckout)}>
              <Controller
                name='billingInterval'
                control={control}
                render={({ field: { onChange, onBlur, value, name, ref } }) => (
                  <InputContainerStyled>
                    <LabelStyled>Billing interval</LabelStyled>
                    <Select<PricingOption>
                      options={[...billingIntervalOptions]}
                      components={{
                        IndicatorSeparator: null,
                        DropdownIndicator: ({ innerProps }) => (
                          <IconChevronStyled {...innerProps} />
                        ),
                      }}
                      styles={getCustomStyles({ hasError: !!errors.billingInterval })}
                      isClearable={false}
                      isSearchable={false}
                      defaultValue={billingIntervalOptions.find(
                        (price) => price.value == billingInterval
                      )}
                      onBlur={onBlur}
                      onChange={onChange}
                      ref={ref}
                    />
                  </InputContainerStyled>
                )}
              />
              {isCardPayment && (
                <>
                  {!billingInfo?.card && (
                    <AddressStyled>
                      <LabelStyled>Billing information</LabelStyled>
                      <AddressInputsStyled>
                        <AddressInputStyled
                          borderRadius='8px 8px 0 0'
                          hasError={!!errors.name}
                          type='text'
                          id='name'
                          placeholder='Full name'
                          {...register('name', {
                            required: { value: true, message: 'Required' },
                          })}
                        />
                        <Controller
                          name='country'
                          control={control}
                          rules={{ required: true }}
                          render={({ field: { onChange, onBlur, value, name, ref } }) => (
                            <Select
                              placeholder='Country'
                              options={countries}
                              defaultValue={
                                billingInfo
                                  ? countries.find(
                                      (country) =>
                                        country.value == billingInfo.customer.address.country
                                    )
                                  : ''
                              }
                              components={{
                                IndicatorSeparator: null,
                                DropdownIndicator: ({ innerProps }) => (
                                  <IconChevronStyled {...innerProps} />
                                ),
                              }}
                              styles={getCustomStyles({
                                borderRadius: '0px',
                                hasError: !!errors.country,
                              })}
                              onBlur={onBlur}
                              onChange={onChange}
                              ref={ref}
                            />
                          )}
                        />
                        <AddressInputStyled
                          borderRadius='0px'
                          hasError={!!errors.address}
                          type='text'
                          id='address'
                          placeholder='Address'
                          {...register('address', {
                            required: { value: true, message: 'Required' },
                          })}
                        />
                        <AddressInputStyled
                          borderRadius='0px'
                          hasError={!!errors.city}
                          type='text'
                          id='city'
                          placeholder='City'
                          {...register('city', {
                            required: { value: true, message: 'Required' },
                          })}
                        />
                        <AddressRowStyled>
                          {(watchCountry || !watchCountry) && (
                            <AddressInputStyled
                              borderRadius='0 0 0 8px'
                              hasError={!!errors.zip}
                              type='text'
                              id='zip'
                              placeholder='Zip code'
                              {...register('zip', {
                                required: { value: true, message: 'Required' },
                                pattern: new RegExp(
                                  // @ts-ignore
                                  getZipRegexByCountry(getValues('country')?.value)
                                ),
                              })}
                            />
                          )}
                          <AddressInputStyled
                            borderRadius='0 0 8px 0'
                            hasError={!!errors.state}
                            type='text'
                            id='state'
                            placeholder='State / Province'
                            {...register('state', {
                              required: { value: true, message: 'Required' },
                            })}
                          />
                        </AddressRowStyled>
                      </AddressInputsStyled>
                    </AddressStyled>
                  )}
                  <InputContainerStyled>
                    <LabelStyled>Payment information</LabelStyled>
                    {billingInfoIsLoading ? (
                      <Skeleton />
                    ) : billingInfo?.card ? (
                      <PaymentMethod
                        billingInfo={billingInfo}
                        isLoading={billingInfoIsLoading}
                        showCardOnly={true}
                      />
                    ) : (
                      <CardElementStyled
                        onReady={(element) => {
                          setCardElemetReady(true)
                        }}
                        isFocused={cardElemetFocused}
                        isReady={cardElemetReady}
                        onFocus={() => setCardElemetFocused(true)}
                        onBlur={() => setCardElemetFocused(false)}
                        options={{
                          hidePostalCode: true,
                          style: customStylesCardElement.current,
                        }}
                        onChange={({ empty, complete, error }) => {
                          setCardElemetComplete(complete)
                        }}
                      />
                    )}
                  </InputContainerStyled>
                </>
              )}
              <ButtonStyled
                type='submit'
                disabled={billingInfoIsLoading || formProcessing || poolingSubscription}
              >
                {submitButtonText()}
              </ButtonStyled>
              {billingInfo ? <ChargeSummary /> : <Skeleton />}
              {messages && <ErrorStyled>{messages}</ErrorStyled>}
            </FormStyled>
          </SkeletonTheme>
        </>
      )}
    </>
  )
}

export { Modal }
