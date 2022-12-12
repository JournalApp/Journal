import React, { useState, useEffect, useRef } from 'react'
import dayjs from 'dayjs'
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton'
import relativeTime from 'dayjs/plugin/relativeTime'
import { CancelOrResume } from '../CancelOrResume'
import { CancelImmediately } from '../CancelImmediately'
import { ChangeCycle } from '../ChangeCycle'
import styled from 'styled-components'
import { theme } from 'themes'
import type { Subscription, BillingInfo } from 'types'
import { fetchProducts, calcYearlyPlanSavings } from '../../../../context/UserContext/subscriptions'
import { useQuery } from '@tanstack/react-query'
import * as Const from 'consts'
import { stripeEpochToDate } from 'utils'
import {
  HeaderStyled,
  TextStyled,
  ActionsStyled,
  ActionStyled,
  ContentStyled,
  CardStyled,
  ReceiptsRowStyled,
} from './styled'

dayjs.extend(relativeTime)

const Red = styled.span`
  color: ${theme('color.error.main')};
`
interface PlanProps {
  subscription: Subscription
  billingInfo: BillingInfo
  isLoading: boolean
}

const Plan = ({ subscription, billingInfo, isLoading }: PlanProps) => {
  const { data: prices } = useQuery({
    queryKey: ['prices'],
    queryFn: fetchProducts,
    cacheTime: 5 * 60 * 1000, // 5 minutes
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled:
      subscription?.prices?.products.id == Const.productWriterId &&
      subscription?.prices?.interval == 'month',
  })

  const BillingStatus = () => {
    if (subscription.cancel_at_period_end) {
      return (
        <>
          <Red>Plan is canceled.</Red> You still have access for{' '}
          {dayjs(dayjs()).to(subscription.current_period_end, true)} (
          {dayjs(subscription.current_period_end).format('MMM D, YYYY')})
        </>
      )
    }

    if (billingInfo) {
      const { invoices } = billingInfo
      const inv = invoices.filter(
        (invoice) =>
          invoice.status == 'open' && invoice.paid == false && invoice.next_payment_attempt != null
      )
      if (inv.length) {
        return (
          <Red>
            {`Last payment failed, next attempt on `}
            {dayjs(stripeEpochToDate(inv[0].next_payment_attempt)).format('MMM D, YYYY')}
          </Red>
        )
      }
    }

    return (
      <>
        {`Next billing in `}
        {dayjs(dayjs()).to(subscription.current_period_end, true)} (
        {dayjs(subscription.current_period_end).format('MMM D, YYYY')})
      </>
    )
  }

  const savings = prices
    ? calcYearlyPlanSavings(prices.filter((price) => price.product_id == Const.productWriterId))
    : ''

  return (
    <SkeletonTheme baseColor={theme('color.popper.pure', 0.6)} enableAnimation={false}>
      <HeaderStyled>Plan</HeaderStyled>
      {subscription ? (
        <ContentStyled>
          <TextStyled>
            <strong>{subscription?.prices?.products?.name}</strong>
            <br />
            {isLoading ? <Skeleton /> : <BillingStatus />}
          </TextStyled>
          <ActionsStyled>
            {subscription.cancel_at_period_end ? (
              <CancelOrResume
                action='resume'
                renderTrigger={({ open, ...rest }: any) => (
                  <ActionStyled onClick={open} {...rest}>
                    Resume plan
                  </ActionStyled>
                )}
              />
            ) : (
              <>
                {subscription.status == 'past_due' ? (
                  <CancelImmediately
                    renderTrigger={({ open, ...rest }: any) => (
                      <ActionStyled onClick={open} {...rest}>
                        Cancel plan
                      </ActionStyled>
                    )}
                  />
                ) : (
                  <>
                    <ChangeCycle
                      prices={prices}
                      renderTrigger={({ open, ...rest }: any) => (
                        <ActionStyled
                          isHidden={subscription.prices.interval == 'year'}
                          onClick={open}
                          {...rest}
                        >
                          Change to yearly (save {savings})
                        </ActionStyled>
                      )}
                    />
                    <CancelOrResume
                      action='cancel'
                      renderTrigger={({ open, ...rest }: any) => (
                        <ActionStyled onClick={open} {...rest}>
                          Cancel plan
                        </ActionStyled>
                      )}
                    />
                  </>
                )}
              </>
            )}
          </ActionsStyled>
        </ContentStyled>
      ) : (
        <ContentStyled>
          <TextStyled>
            <strong>Free</strong>
          </TextStyled>
        </ContentStyled>
      )}
    </SkeletonTheme>
  )
}

export { Plan }
