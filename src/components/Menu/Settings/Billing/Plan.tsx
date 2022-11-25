import React, { useState, useEffect, useRef } from 'react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
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

interface PlanProps {
  subscription: Subscription
}

const Plan = ({ subscription }: PlanProps) => {
  return (
    <>
      <HeaderStyled>Plan</HeaderStyled>
      <ContentStyled>
        <TextStyled>
          <strong>{subscription.prices?.products?.name}</strong>
          <br />
          Next billing {dayjs(dayjs()).to(subscription.current_period_end)} (
          {dayjs(subscription.current_period_end).format('MMM D, YYYY')})
        </TextStyled>
        <ActionsStyled>
          <ActionStyled>Change to yearly (save 20%)</ActionStyled>
          <ActionStyled>Cancel plan</ActionStyled>
        </ActionsStyled>
      </ContentStyled>
    </>
  )
}

export { Plan }
