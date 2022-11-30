import React, { useState, useEffect, useRef } from 'react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { CancelOrResume } from '../CancelOrResume'
import styled from 'styled-components'
import { theme } from 'themes'
import type { Subscription } from 'types'
import { fetchProducts, calcYearlyPlanSavings } from '../../../../context/UserContext/subscriptions'
import { useQuery } from '@tanstack/react-query'
import * as Const from 'consts'
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
}

const Plan = ({ subscription }: PlanProps) => {
  const {
    isLoading,
    isError,
    data: prices,
    error,
  } = useQuery({
    queryKey: ['prices'],
    queryFn: fetchProducts,
    cacheTime: 5 * 60 * 1000, // 5 minutes
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled:
      subscription?.prices?.products.id == Const.productWriterId &&
      subscription?.prices?.interval == 'month',
  })

  const savings = prices
    ? calcYearlyPlanSavings(prices.filter((price) => price.product_id == Const.productWriterId))
    : ''

  return (
    <>
      <HeaderStyled>Plan</HeaderStyled>
      {subscription ? (
        <ContentStyled>
          <TextStyled>
            <strong>{subscription?.prices?.products?.name}</strong>
            <br />
            {subscription.cancel_at_period_end ? (
              <>
                <Red>Plan is canceled.</Red> You still have access for{' '}
              </>
            ) : (
              'Next billing in '
            )}
            {dayjs(dayjs()).to(subscription.current_period_end, true)} (
            {dayjs(subscription.current_period_end).format('MMM D, YYYY')})
          </TextStyled>
          <ActionsStyled>
            {subscription.cancel_at_period_end ? (
              <CancelOrResume
                action='resume'
                renderTrigger={({ close, ...rest }: any) => (
                  <ActionStyled onClick={close} {...rest}>
                    Resume plan
                  </ActionStyled>
                )}
              />
            ) : (
              <>
                <ActionStyled>Change to yearly (save {savings})</ActionStyled>
                <CancelOrResume
                  action='cancel'
                  renderTrigger={({ close, ...rest }: any) => (
                    <ActionStyled onClick={close} {...rest}>
                      Cancel plan
                    </ActionStyled>
                  )}
                />
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
    </>
  )
}

export { Plan }
