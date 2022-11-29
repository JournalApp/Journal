import React, { useState, useEffect, useRef } from 'react'
import { theme, getCSSVar } from 'themes'
import { useForm, Controller, SubmitHandler } from 'react-hook-form'
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
import { displayAmount } from 'utils'
import { loadStripe, PaymentIntent } from '@stripe/stripe-js'
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import Select from 'react-select'
import type { Countries, Price } from 'types'
import { useUserContext } from 'context'
import Stripe from 'stripe'
import { getSubscription, getCustomer } from '../../../../context/UserContext/subscriptions'
import {
  IconCloseStyled,
  IconChevronStyled,
  CheckoutModalStyled,
  InputContainerStyled,
  ButtonStyled,
  LabelStyled,
  InputStyled,
  FormStyled,
  CardElementStyled,
  AddressStyled,
  AddressInputsStyled,
  AddressRowStyled,
  getCustomStyles,
  ErrorStyled,
  TextStyled,
} from './styled'
import { Success } from './Success'
import { LeftPanel } from './LeftPanel'
import { PaymentMethod } from './../Billing/PaymentMethod'
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton'

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

interface SubscribeProps {
  renderTrigger: any
  prices: Price[]
  billingInterval: 'year' | 'month'
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

const Subscribe = ({ renderTrigger, prices, billingInterval }: SubscribeProps) => {
  logger('Checkout rerender')
  const [open, setOpen] = useState(false)
  const nodeId = useFloatingNodeId()
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

  const {
    isLoading,
    isError,
    data: countries,
    error,
  } = useQuery({
    queryKey: ['countries'],
    queryFn: fetchCountries,
  })

  const { isLoading: billingInfoIsLoading, data: billingInfo } = useQuery({
    queryKey: ['billingInfo'],
    queryFn: async () => getCustomer(session.access_token),
  })

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
        subscription.current = data
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

  interface PricingOption {
    value: 'year' | 'month'
    label: string
  }

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
    { value: 'year', label: `Yearly – $${yearlyPrice / 100} / year (save 20%)` },
    { value: 'month', label: `Monthly – $${monthlyPrice / 100} / month` },
  ]

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    reset,
    trigger,
    control,
    watch,
    formState: { errors },
  } = useForm<FormData>()

  const watchCountry = watch('country', { value: 'US', label: '' })
  const watchBillingInterval = watch(
    'billingInterval',
    billingIntervalOptions.find((price) => price.value == billingInterval)
  )

  const handleCloseEsc = (e: any) => {
    if (e.key == 'Escape') {
      if (refs.floating.current && refs.floating.current.contains(document.activeElement)) {
        setOpen(false)
      }
    }
  }

  // Initialize an instance of stripe.
  const stripe = useStripe()
  const elements = useElements()

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
    if (!open) {
      reset()
    }
    setValue(
      'billingInterval',
      billingIntervalOptions.find((price) => price.value == billingInterval)
    )
  }, [open])

  useEffect(() => {
    logger('✅ addEventListener')
    document.addEventListener('keydown', handleCloseEsc)

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

    return () => {
      logger('❌ removeEventListener')
      document.removeEventListener('keydown', handleCloseEsc)
    }
  }, [])

  //////////////////////////
  // Submit
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
    if (isCardPayment) {
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

    if (isCardPayment && clientSecret) {
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
        // setMessage(error.message)
        setMessages('There was an error processing your payment, please try again')
        setFormProcessing(false)
        return
      }
      setPaymentIntent(paymentIntent)
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

  const PaymentInformation = () => {
    return (
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
    )
  }

  logger('Errors:')
  logger(errors)

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
              <CheckoutModalStyled ref={floating} {...getFloatingProps()}>
                <IconCloseStyled onClick={() => setOpen(false)} />
                {success ? (
                  <Success />
                ) : (
                  <>
                    <LeftPanel />
                    <SkeletonTheme
                      baseColor={theme('color.popper.pure', 0.6)}
                      enableAnimation={false}
                    >
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
                            <AddressStyled>
                              <LabelStyled>Billing information</LabelStyled>
                              <AddressInputsStyled>
                                <InputStyled
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
                                <InputStyled
                                  borderRadius='0px'
                                  hasError={!!errors.address}
                                  type='text'
                                  id='address'
                                  placeholder='Address'
                                  {...register('address', {
                                    required: { value: true, message: 'Required' },
                                  })}
                                />
                                <InputStyled
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
                                    <InputStyled
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
                                  <InputStyled
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
                            <PaymentInformation />
                          </>
                        )}
                        <ButtonStyled
                          type='submit'
                          disabled={billingInfoIsLoading || formProcessing || poolingSubscription}
                        >
                          {submitButtonText()}
                        </ButtonStyled>
                        {billingInfo ? <ChargeSummary /> : <Skeleton />}
                        <ErrorStyled>{messages}</ErrorStyled>
                      </FormStyled>
                    </SkeletonTheme>
                  </>
                )}
              </CheckoutModalStyled>
            </FloatingFocusManager>
          </FloatingOverlay>
        )}
      </FloatingPortal>
    </FloatingNode>
  )
}

export { Subscribe }
