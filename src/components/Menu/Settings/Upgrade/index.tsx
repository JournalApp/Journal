import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { theme } from 'themes'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import { Subscribe } from './Subscribe'
import type { PaymentIntent, Stripe } from '@stripe/stripe-js'
import { SectionTitleStyled } from '../styled'

const UpgradeTabContent = () => {
  return <SectionTitleStyled>Upgrade your plan</SectionTitleStyled>
}

export { UpgradeTabContent }
