import React, { useState, useEffect, useRef } from 'react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { CancelOrResume } from '../CancelOrResume'
import styled from 'styled-components'
import { theme } from 'themes'
import type { Subscription } from 'types'
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
                <ActionStyled>Change to yearly (save 20%)</ActionStyled>
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
