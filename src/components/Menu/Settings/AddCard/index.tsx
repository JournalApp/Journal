import React, { useState, useEffect, useRef } from 'react'
import { theme, getCSSVar } from 'themes'
import { useForm, Controller, SubmitHandler } from 'react-hook-form'
import { logger, getZipRegexByCountry } from 'utils'
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
import { PaymentIntent } from '@stripe/stripe-js'
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import Select from 'react-select'
import type { Countries, Price } from 'types'
import { useUserContext } from 'context'
import Stripe from 'stripe'
import {
  getSubscription,
  getCustomer,
  fetchCountries,
  createSetupIntent,
} from '../../../../context/UserContext/subscriptions'
import {
  CheckoutModalStyled,
  ButtonStyled,
  TextStyled,
  FormStyled,
  Title,
  ActionsWrapperStyled,
  ButtonGhostStyled,
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

import { PaymentMethod } from './../Billing/PaymentMethod'
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton'

interface AddCardProps {
  renderTrigger: any
}

type FormData = {
  name: string
  country: { value: string; label: string }
  address: string
  city: string
  zip: string
  state: string
  cardElement: any
}

//////////////////////////
// 🍔 AddCard component
//////////////////////////

const AddCard = ({ renderTrigger }: AddCardProps) => {
  logger('AddCard rerender')
  const [open, setOpen] = useState(false)
  const nodeId = useFloatingNodeId()
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null)
  const [cardElemetFocused, setCardElemetFocused] = useState(false)
  const [cardElemetReady, setCardElemetReady] = useState(false)
  const [cardElemetComplete, setCardElemetComplete] = useState(false)
  const [formProcessing, setFormProcessing] = useState(false)
  const [messages, setMessages] = useState('')
  const [success, setSuccess] = useState(false)
  const customStylesCardElement = useRef({})
  const { session, subscription, createSubscription } = useUserContext()

  const { data: countries } = useQuery({
    queryKey: ['countries'],
    queryFn: fetchCountries,
  })

  const { isLoading: billingInfoIsLoading, data: billingInfo } = useQuery({
    queryKey: ['billingInfo'],
    queryFn: async () => getCustomer(session.access_token),
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

  const watchCountry = watch('country', {
    value: 'US',
    label: '',
  })

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

  //////////////////////////
  // 🏓 useEffect
  //////////////////////////

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
  }, [billingInfo, open])

  useEffect(() => {
    if (!open) {
      reset()
    }
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
  // 💸 Submit form
  //////////////////////////

  const submitCard: SubmitHandler<FormData> = async (data) => {
    if (formProcessing) {
      return
    }
    logger('Submitted data:')
    logger(data)

    if (!cardElemetComplete) {
      elements.getElement(CardElement).focus()
      return
    }

    setFormProcessing(true)

    // 1. Create subscription and Save billing address to make stripe tax work

    const address = {
      city: data.city,
      country: data.country.value,
      line1: data.address,
      line2: '',
      postal_code: data.zip,
      state: data.state,
    }

    const { clientSecret } = await createSetupIntent({
      access_token: session.access_token,
      address,
    })

    if (subscriptionId) {
      setSubscriptionId(subscriptionId)
    } else {
      setMessages('There was an error processing your payment, please try again')
      setFormProcessing(false)
      return
    }

    // 2. Create payment using clientSecret
    // if clientSecret is empty, stripe didn't create a invoice
    const cardElement = elements.getElement(CardElement)

    let { error } = await stripe.confirmCardSetup(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: data.name,
        },
      },
    })

    if (error) {
      setMessages('There was an error when saving your card, please try again')
      setFormProcessing(false)
      return
    }

    // TODO
    // Handle success
  }

  const submitButtonText = () => {
    if (formProcessing) {
      return 'Processing...'
    } else {
      return 'Update/Add'
    }
  }

  //////////////////////////
  // 🚀 Return
  //////////////////////////

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
                <Title>Add payment method</Title>
                <SkeletonTheme baseColor={theme('color.popper.pure', 0.6)} enableAnimation={false}>
                  <FormStyled onSubmit={handleSubmit(submitCard)}>
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
                    <div>
                      <ActionsWrapperStyled>
                        <ButtonGhostStyled
                          onClick={() => setOpen(false)}
                          disabled={billingInfoIsLoading || formProcessing || success}
                        >
                          Cancel
                        </ButtonGhostStyled>
                        <ButtonStyled
                          type='submit'
                          disabled={billingInfoIsLoading || formProcessing || success}
                        >
                          {submitButtonText()}
                        </ButtonStyled>
                      </ActionsWrapperStyled>
                      <ErrorStyled>{messages}</ErrorStyled>
                    </div>
                  </FormStyled>
                </SkeletonTheme>
              </CheckoutModalStyled>
            </FloatingFocusManager>
          </FloatingOverlay>
        )}
      </FloatingPortal>
    </FloatingNode>
  )
}

export { AddCard }
