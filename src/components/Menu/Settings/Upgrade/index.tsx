import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { theme } from 'themes'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import { Subscribe } from './Subscribe'
import type { PaymentIntent, Stripe } from '@stripe/stripe-js'
import * as Switch from '@radix-ui/react-switch'
import { SectionTitleStyled } from '../styled'

const PlansSectionStyled = styled.div`
  display: flex;
  gap: 16px;
`

interface PlanStyledProps {
  bgColor?: string
}

const PlanStyled = styled.div<PlanStyledProps>`
  display: flex;
  flex-direction: column;
  gap: 16px;
  background-color: ${(props) => (props.bgColor ? props.bgColor : 'transparent')};
  flex-grow: 1;
  border-radius: 12px;
  padding: 16px;
`

const PlanTitleStyled = styled.div`
  font-style: normal;
  font-weight: 500;
  font-size: 18px;
  line-height: 28px;
  letter-spacing: -0.03em;
  & sub {
    display: block;
    font-style: normal;
    letter-spacing: normal;
    font-weight: 400;
    font-size: 12px;
    line-height: 18px;
    color: ${theme('color.primary.main', 0.8)};
  }
`

const PlansLimitsBoxStyled = styled.div`
  display: flex;
  gap: 0;
  flex-direction: column;
  font-style: normal;
  font-weight: 400;
  font-size: 14px;
  line-height: 24px;
  padding: 8px 12px 12px 12px;
  border-radius: 8px;
  background-color: ${theme('color.pure', 0.6)};
`

interface PlansProgressBarStyledProps {
  progress?: string
}

const PlansProgressBarStyled = styled.div<PlansProgressBarStyledProps>`
  margin-top: 8px;
  background-color: #dae5d6;
  height: 3px;
  border-radius: 3px;
  & div {
    width: ${(props) => (props.progress ? props.progress : '0')};
    background-color: ${theme('color.popper.main')};
    height: 3px;
    border-radius: 3px;
  }
`

const Infinity = styled.div`
  color: ${theme('color.primary.main', 0.8)};
  font-style: normal;
  font-weight: 400;
  font-size: 12px;
  line-height: 15px;
  margin-bottom: -4px;
`

const PriceContainerStyled = styled.div`
  display: flex;
`

const PriceStyled = styled.div`
  flex-grow: 1;
  font-weight: 500;
  font-size: 14px;
  line-height: 28px;
  letter-spacing: -0.03em;
`

const SwitchStyled = styled(Switch.Root)`
  all: unset;
  width: 42px;
  height: 25px;
  background-color: ${theme('color.primary.main', 0.8)};
  border-radius: 9999px;
  position: relative;
  box-shadow: 0 2px 10px black;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  &:focus {
    box-shadow: 0 0 0 2px black;
  }
  &[data-state='checked'] {
    background-color: black;
  }
`

const SwitchThumbStyled = styled(Switch.Thumb)`
  display: block;
  width: 21px;
  height: 21px;
  background-color: white;
  border-radius: 9999px;
  box-shadow: 0 2px 2px black;
  transition: transform 100ms;
  transform: translateX(2px);
  will-change: transform;
  &[data-state='checked'] {
    transform: translateX(19px);
  }
`

const UpgradeTabContent = () => {
  return (
    <>
      <SectionTitleStyled>Upgrade your plan</SectionTitleStyled>
      <PlansSectionStyled>
        <PlanStyled bgColor='#E0ECDB'>
          <PlanTitleStyled>
            Free<sub>Try it out</sub>
          </PlanTitleStyled>
          <PlansLimitsBoxStyled>
            30 entries (8 used)
            <PlansProgressBarStyled progress='25%'>
              <div></div>
            </PlansProgressBarStyled>
          </PlansLimitsBoxStyled>
          <PriceContainerStyled>
            <PriceStyled>$0</PriceStyled>
          </PriceContainerStyled>
        </PlanStyled>
        <PlanStyled bgColor='#D8DEFF'>
          <PlanTitleStyled>
            Writer<sub>Write without limits</sub>
          </PlanTitleStyled>
          <PlansLimitsBoxStyled>
            Unlimited entries<Infinity>∞</Infinity>
          </PlansLimitsBoxStyled>
          <PriceContainerStyled>
            <PriceStyled>$4 / month</PriceStyled>
            <SwitchStyled>
              <SwitchThumbStyled />
            </SwitchStyled>
            Billed yearly
          </PriceContainerStyled>
        </PlanStyled>
      </PlansSectionStyled>
    </>
  )
}

export { UpgradeTabContent }
