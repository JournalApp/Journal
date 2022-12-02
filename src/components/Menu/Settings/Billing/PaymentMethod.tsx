import React, { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { loadStripe } from '@stripe/stripe-js/pure'
import { Elements } from '@stripe/react-stripe-js'
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton'
import { Icon } from 'components'
import { theme } from 'themes'
import { AddCard } from '../AddCard'
import { logger, capitalize, stripeEpochToDate, isDev } from 'utils'
import {
  HeaderStyled,
  TextStyled,
  ActionsStyled,
  ActionStyled,
  ContentStyled,
  CardStyled,
  ReceiptsRowStyled,
} from './styled'
import type { PaymentMethodProps } from './types'
import type { BillingInfo } from 'types'

const PaymentMethod = ({ billingInfo, isLoading, showCardOnly = false }: PaymentMethodProps) => {
  const [stripePromise, setStripePromise] = useState<any | null>(null)
  const card = billingInfo?.card

  useQuery({
    queryKey: ['stripePromise'],
    queryFn: async () => {
      const url = isDev() ? 'https://s.journal.local' : 'https://s.journal.do'
      const { publishableKey } = await fetch(`${url}/api/v1/config`).then((r) => r.json())
      setStripePromise(() => loadStripe(publishableKey))
      return publishableKey
    },
  })

  const Card = () => {
    if (card) {
      const expire = card.card.exp_month + '/' + card.card.exp_year.toString().substring(2)
      const brand = capitalize(card.card.brand)
      const last4 = card.card.last4
      return (
        <CardStyled>
          <Icon name='CardBrand' type={card.card.brand} />
          <em>
            {brand} **** {last4}
          </em>
          expiring {expire}
        </CardStyled>
      )
    }
    return <CardStyled>No card added</CardStyled>
  }

  return (
    <SkeletonTheme baseColor={theme('color.popper.pure', 0.6)} enableAnimation={false}>
      {!showCardOnly && <HeaderStyled>Payment method</HeaderStyled>}
      <ContentStyled>
        <TextStyled>{isLoading ? <Skeleton width='50%' /> : <Card />}</TextStyled>
        {!showCardOnly &&
          (isLoading ? (
            <Skeleton />
          ) : card ? (
            <ActionsStyled>
              <AddCard
                isUpdate={true}
                renderTrigger={({ close, ...rest }: any) => (
                  <ActionStyled onClick={close} {...rest}>
                    Update
                  </ActionStyled>
                )}
              />
            </ActionsStyled>
          ) : (
            <ActionsStyled>
              <Elements stripe={stripePromise}>
                <AddCard
                  renderTrigger={({ close, ...rest }: any) => (
                    <ActionStyled onClick={close} {...rest}>
                      Add card
                    </ActionStyled>
                  )}
                />
              </Elements>
            </ActionsStyled>
          ))}
      </ContentStyled>
    </SkeletonTheme>
  )
}

export { PaymentMethod }
