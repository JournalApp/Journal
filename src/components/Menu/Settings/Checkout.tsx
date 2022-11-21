import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { theme, getCSSVar } from 'themes'
import { useForm, Controller, SubmitHandler, ValidationRule } from 'react-hook-form'
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
import {
  Elements,
  CardElement,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { Icon } from 'components'
import Select from 'react-select'
import type { Countries, Price } from 'types'
import { useUserContext } from 'context'
import Stripe from 'stripe'
import { getSubscription } from './../../../context/UserContext/subscriptions'

const IconCloseStyled = styled((props) => <Icon name='Cross' {...props} />)`
  position: absolute;
  top: 16px;
  right: 16px;
  opacity: 0.8;
  cursor: pointer;
  &:hover {
    opacity: 1;
    color: ${theme('color.primary.main')};
  }
`

const IconChevronStyled = styled((props) => <Icon name='Chevron' {...props} />)`
  padding-right: 8px;
  opacity: 0.6;
`

const CheckoutModal = styled.div`
  background-color: ${theme('color.popper.surface')};
  display: flex;
  position: relative;
  padding: 0;
  padding: 40px 48px 32px 32px;
  margin: 48px 8px 8px 8px;
  border-radius: 8px;
  -webkit-app-region: no-drag;
`

const LeftPanel = styled.div`
  width: 260px;
  color: ${theme('color.primary.main')};
  font-weight: 500;
  font-size: 21px;
  line-height: 26px;
  & em {
    opacity: 0.6;
    font-style: normal;
  }
`

const InputContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
`

const Button = styled.button`
  background-color: ${theme('color.popper.main')};
  color: ${theme('color.popper.inverted')};
  outline: 0;
  border: 0;
  font-weight: 500;
  font-size: 14px;
  line-height: 24px;
  cursor: pointer;
  display: flex;
  padding: 8px 12px;
  border-radius: 6px;
  width: fit-content;
  transition: box-shadow ${theme('animation.time.normal')} ease;
  &:hover,
  &:focus {
    box-shadow: 0 0 0 2px ${theme('color.popper.main', 0.15)};
  }
  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
`

const Label = styled.div`
  margin-bottom: 8px;
  color: ${theme('color.primary.main')};
  opacity: 0.8;
  font-size: 12px;
  font-weight: 500;
  font-style: normal;
  line-height: 16px;
  white-space: nowrap;
  pointer-events: none;
`

interface CardElementProps {
  isFocused: boolean
  isReady: boolean
}

const CardElementStyled = styled(CardElement)<CardElementProps>`
  padding: 12px;
  box-sizing: border-box;
  height: 43px;
  background-color: ${theme('color.popper.pure', 0.8)};
  color: ${theme('color.primary.main')};
  border: ${(props) =>
    props.isFocused
      ? `1px solid ${theme('color.popper.main')}`
      : `1px solid ${theme('color.popper.border')}`};
  box-shadow: ${(props) =>
    props.isFocused ? `0 0 0 2px ${theme('color.popper.main', 0.1)}` : null};
  border-radius: 8px;
  outline: 0;
  opacity: ${(props) => (props.isReady ? 1 : 0.6)};
  transition: all ${theme('animation.time.normal')};
  &:hover {
    transition: all ${theme('animation.time.normal')};
    box-shadow: 0 0 0 2px ${theme('color.popper.main', 0.1)};
  }
  &::placeholder {
    opacity: 0.6;
  }
`

interface InputProps {
  borderRadius?: string
  hasError: boolean
}

const Input = styled.input<InputProps>`
  padding: 8px 12px;
  background-color: ${theme('color.popper.pure', 0.8)};
  color: ${(props) => (props.hasError ? theme('color.error.main') : theme('color.primary.main'))};
  border: 0;
  border-radius: ${(props) => (props.borderRadius ? props.borderRadius : '8px')};
  box-sizing: border-box;
  width: 100%;
  font-size: 14px;
  line-height: 24px;
  font-weight: 400;
  transition: all ${theme('animation.time.normal')};
  &:focus,
  &:active {
    background-color: ${theme('color.popper.pure')};
    outline: 0;
    transition: all ${theme('animation.time.normal')};
  }
  &:hover {
    background-color: ${theme('color.popper.pure', 0.9)};
  }
  &::placeholder {
    opacity: 0.6;
    color: ${(props) => (props.hasError ? theme('color.error.main') : theme('color.primary.main'))};
  }
`

const Form = styled.form`
  width: 368px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const AddressStyled = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
`
const AddressInputsStyled = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  border-radius: 7px;
  border: 1px solid ${theme('color.popper.border')};
  &:focus-within {
    border: 1px solid ${theme('color.popper.main')};
    box-shadow: 0 0 0 2px ${theme('color.popper.main', 0.1)};
    outline: 0;
    transition: all ${theme('animation.time.normal')};
  }
  &:hover {
    transition: all ${theme('animation.time.normal')};
    box-shadow: 0 0 0 2px ${theme('color.popper.main', 0.1)};
  }
`

const AddressRowStyled = styled.div`
  display: flex;
`

interface getCustomStylesProps {
  borderRadius?: string
  hasError: boolean
}

const getCustomStyles = ({ borderRadius, hasError }: getCustomStylesProps) => {
  return {
    option: (provided: any, state: any) => ({
      ...provided,
      fontWeight: state.isSelected ? 'bold' : 'medium',
      fontSize: '14px',
      color: theme('color.popper.main'),
      backgroundColor: state.isFocused ? theme('color.popper.hover') : null,
      cursor: 'pointer',
      borderRadius: 8,
      paddingTop: 8,
      paddingBottom: 8,
      paddingLeft: 12,
      paddingRight: 12,
      '&:active': {
        backgroundColor: theme('color.popper.hover'),
      },
    }),
    menuList: (provided: any) => ({ ...provided, padding: 4, boxShadow: theme('style.shadow') }),
    menu: (provided: any) => ({
      ...provided,
      backgroundColor: theme('color.popper.pure'),
      borderRadius: 12,
      border: 0,
    }),
    control: (provided: any, state: any) => ({
      // none of react-select's styles are passed to <Control />
      ...provided,
      color: hasError ? theme('color.error.main') : theme('color.popper.main'),
      fontSize: '14px',
      display: 'flex',
      backgroundColor: state.isFocused
        ? theme('color.popper.pure', 0.9)
        : theme('color.popper.pure', 0.8),
      border: borderRadius
        ? 0
        : state.menuIsOpen
        ? `1px solid ${theme('color.popper.main')}`
        : `1px solid ${theme('color.popper.border')}`,
      boxShadow: borderRadius
        ? null
        : state.menuIsOpen
        ? `0 0 0 2px ${theme('color.popper.main', 0.1)}`
        : null,
      borderRadius: borderRadius || 8,
      padding: '2px 2px',
      transition: `all ${theme('animation.time.normal')}`,
      '&:hover': {
        cursor: 'pointer',
        boxShadow: borderRadius ? null : `0 0 0 2px ${theme('color.popper.main', 0.1)}`,
        backgroundColor: theme('color.popper.pure', 0.9),
      },
    }),
    placeholder: (provided: any, state: any) => ({
      ...provided,
      color: hasError ? theme('color.error.main') : theme('color.popper.main'),
      opacity: 0.6,
    }),
    input: (provided: any, state: any) => ({
      ...provided,
      color: theme('color.popper.main'),
      padding: 0,
    }),
    singleValue: (provided: any, state: any) => {
      const opacity = state.isDisabled ? 0.5 : 1
      const transition = 'opacity 300ms'
      const padding = 0
      const color = theme('color.popper.main')
      return { ...provided, opacity, transition, padding, color }
    },
  }
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

const Success = () => {
  // TODO how to rerender whole app?
  return <div>Success</div>
}

interface CheckoutProps {
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

const Checkout = ({ renderTrigger, prices, billingInterval }: CheckoutProps) => {
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
    enabled: !!(paymentIntent?.status === 'succeeded'),
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
    setError,
    setFocus,
    getValues,
    resetField,
    reset,
    trigger,
    control,
    clearErrors,
    watch,
    formState: { errors, isDirty },
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
    if (getValues('zip')) {
      trigger('zip')
    }
  }, [watchCountry])

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
        // backgroundColor: `rgba(${styles.getPropertyValue(getCSSVar('color.popper.pure'))},)`,
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

  const submitCheckout: SubmitHandler<FormData> = async (data) => {
    if (formProcessing) {
      return
    }
    setFormProcessing(true)
    logger('Submitted data:')
    logger(data)
    if (!cardElemetComplete) {
      elements.getElement(CardElement).focus()
      return
    }

    // 1. Create subscription and Save billing address to make stripe tax work
    const address: Stripe.Address = {
      city: data.city,
      country: data.country.value,
      line1: data.address,
      line2: '',
      postal_code: data.zip,
      state: data.state,
    }
    const { subscriptionId, clientSecret } = await createSubscription({
      access_token: session.access_token,
      priceId: prices.filter(
        (price) =>
          price.product_id == Const.productWriterId && price.interval == data.billingInterval.value
      )[0]?.id,
      address,
    })
    setSubscriptionId(subscriptionId)

    // 2. Create payment using clientSecret
    const cardElement = elements.getElement(CardElement)
    // Use card Element to tokenize payment details
    let { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: data.name,
        },
      },
    })
    if (error) {
      // show error and collect new card details.
      // setMessage(error.message)
      setMessages('There was an error processing your payment, please try again')
      setFormProcessing(false)
      return
    }
    setPaymentIntent(paymentIntent)
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
              <CheckoutModal ref={floating} {...getFloatingProps()}>
                <IconCloseStyled onClick={() => setOpen(false)} />
                {success ? (
                  <Success />
                ) : (
                  <>
                    <LeftPanel>
                      Upgrade,
                      <em>
                        <br />
                        write
                        <br />
                        without
                        <br />
                        limits
                      </em>
                    </LeftPanel>
                    <Form onSubmit={handleSubmit(submitCheckout)}>
                      <Controller
                        name='billingInterval'
                        control={control}
                        render={({ field: { onChange, onBlur, value, name, ref } }) => (
                          <InputContainer>
                            <Label>Billing interval</Label>
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
                          </InputContainer>
                        )}
                      />
                      <AddressStyled>
                        <Label>Billing information</Label>
                        <AddressInputsStyled>
                          <Input
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
                          <Input
                            borderRadius='0px'
                            hasError={!!errors.address}
                            type='text'
                            id='address'
                            placeholder='Address'
                            {...register('address', {
                              required: { value: true, message: 'Required' },
                            })}
                          />
                          <Input
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
                              <Input
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
                            <Input
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
                      <InputContainer>
                        <Label>Payment information</Label>
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
                      </InputContainer>
                      <Button type='submit' disabled={formProcessing || poolingSubscription}>
                        {submitButtonText()}
                      </Button>
                      <div>{messages}</div>
                    </Form>
                  </>
                )}
              </CheckoutModal>
            </FloatingFocusManager>
          </FloatingOverlay>
        )}
      </FloatingPortal>
    </FloatingNode>
  )
}

export { Checkout }
