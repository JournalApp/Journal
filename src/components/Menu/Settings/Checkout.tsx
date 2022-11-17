import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { theme, getCSSVar } from 'themes'
import { useForm, Controller, SubmitHandler } from 'react-hook-form'
import { logger, supabase, supabaseUrl, supabaseAnonKey, isDev, awaitTimeout } from 'utils'
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
import { loadStripe, PaymentIntent, Stripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { Icon } from 'components'
import Select from 'react-select'
import type { Countries } from 'types'
import { BorderRadius } from '@styled-icons/boxicons-regular'

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
}

const CardElementStyled = styled(CardElement)<CardElementProps>`
  padding: 12px;
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
}

const Input = styled.input<InputProps>`
  padding: 8px 12px;
  background-color: ${theme('color.popper.pure', 0.8)};
  color: ${theme('color.primary.main')};
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

const getCustomStyles = (borderRadius?: string) => {
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
    input: (provided: any, state: any) => ({
      ...provided,
      padding: 0,
    }),
    singleValue: (provided: any, state: any) => {
      const opacity = state.isDisabled ? 0.5 : 1
      const transition = 'opacity 300ms'
      const padding = '2px'
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

interface CheckoutProps {
  renderTrigger: any
}

type FormData = {
  billingInterval: 'year' | 'month'
  name: string
  country: string
  address: string
  city: string
  zip: string
  state: string
  cardElement: any
}

// TODO accept a prop with selected price
// TODO show real prices
const Checkout = ({ renderTrigger }: CheckoutProps) => {
  logger('Checkout rerender')
  const [open, setOpen] = useState(false)
  const nodeId = useFloatingNodeId()
  const [stripePromise, setStripePromise] = useState<Promise<Stripe> | null>(null)
  const [prices, setPrices] = useState([])
  const [subscriptionData, setSubscriptionData] = useState(null)
  const [cardElemetFocused, setCardElemetFocused] = useState(false)
  const [messages, _setMessages] = useState('')
  const customStylesCardElement = useRef({})
  useQuery({
    queryKey: ['stripePromise'],
    queryFn: async () => {
      const url = isDev() ? 'https://s.journal.local' : 'https://s.journal.do'
      const { publishableKey, prices } = await fetch(`${url}/api/v1/config`).then((r) => r.json())
      setPrices(prices)
      setStripePromise(() => loadStripe(publishableKey))
      return publishableKey
    },
  })
  const {
    isLoading,
    isError,
    data: countries,
    error,
  } = useQuery({
    queryKey: ['countries'],
    queryFn: fetchCountries,
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
    setError,
    setFocus,
    resetField,
    reset,
    control,
    clearErrors,
    watch,
    formState: { errors, isDirty },
  } = useForm<FormData>()

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

  // helper for displaying status messages.
  const setMessage = (message: string) => {
    _setMessages(`${messages}\n\n${message}`)
  }

  const submitCheckout: SubmitHandler<FormData> = (data) => {
    logger('Submitted data:')
    logger(data)

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

  // TODO show errors to the user
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
                {stripePromise && (
                  <Elements stripe={stripePromise}>
                    <Form onSubmit={handleSubmit(submitCheckout)}>
                      <Controller
                        name='billingInterval'
                        control={control}
                        render={({ field: { onChange, onBlur, value, name, ref } }) => (
                          <InputContainer>
                            <Label>Billing interval</Label>
                            <Select
                              options={[
                                { value: 'year', label: 'Yearly – $48 / year (save 20%)' },
                                { value: 'month', label: 'Monthly – $5 / month' },
                              ]}
                              components={{
                                IndicatorSeparator: null,
                                DropdownIndicator: ({ innerProps }) => (
                                  <IconChevronStyled {...innerProps} />
                                ),
                              }}
                              styles={getCustomStyles()}
                              isClearable={false}
                              isSearchable={false}
                              defaultValue={{
                                value: 'year',
                                label: 'Yearly – $48 / year (save 20%)',
                              }}
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
                                styles={getCustomStyles('0px')}
                                onBlur={onBlur}
                                onChange={onChange}
                                ref={ref}
                              />
                            )}
                          />
                          <Input
                            borderRadius='0px'
                            type='text'
                            id='address'
                            placeholder='Address'
                            {...register('address', {
                              required: { value: true, message: 'Required' },
                            })}
                          />
                          <Input
                            borderRadius='0px'
                            type='text'
                            id='city'
                            placeholder='City'
                            {...register('city', {
                              required: { value: true, message: 'Required' },
                            })}
                          />
                          <AddressRowStyled>
                            <Input
                              borderRadius='0 0 0 8px'
                              type='text'
                              id='zip'
                              placeholder='Zip code'
                              {...register('zip', {
                                required: { value: true, message: 'Required' },
                              })}
                            />
                            <Input
                              borderRadius='0 0 8px 0'
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
                          // TODO onReady={} enable submit when ready
                          // handle loading state (before ready)
                          isFocused={cardElemetFocused}
                          onFocus={() => setCardElemetFocused(true)}
                          onBlur={() => setCardElemetFocused(false)}
                          options={{ hidePostalCode: true, style: customStylesCardElement.current }}
                          onChange={({ empty, complete, error }) => {
                            if (complete) {
                              clearErrors('cardElement')
                            }
                            if (error) {
                              setError('cardElement', error)
                            }
                            logger(empty)
                            logger(complete)
                            logger(error)
                          }}
                        />
                      </InputContainer>
                      <Button type='submit'>Upgrade to Writer – $48</Button>
                      <div>{messages}</div>
                    </Form>
                  </Elements>
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
