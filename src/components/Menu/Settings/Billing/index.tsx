import React, { useState, useEffect, useRef } from 'react'
import { theme } from 'themes'
import { logger, supabase, stripeEpochToDate, isDev } from 'utils'
import { SectionTitleStyled } from '../styled'
import { useQuery } from '@tanstack/react-query'
import { useUserContext } from 'context'
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton'
import type { BillingInfo, PaymentMethodProps } from './types'
import { PaymentMethod } from './PaymentMethod'
import { Receipts } from './Receipts'
import { Plan } from './Plan'
import { Balance } from './Balance'
import { Divider } from './styled'

const BillingTabContent = () => {
  logger('BillingTabContent re-render')
  const { session, subscription } = useUserContext()
  const {
    isLoading,
    isError,
    data: billingInfo,
  } = useQuery({
    queryKey: ['billingInfo'],
    queryFn: async () => {
      const url = isDev() ? 'https://s.journal.local' : 'https://s.journal.do'
      return (await fetch(`${url}/api/v1/customer`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      }).then((r) => r.json())) as BillingInfo
    },
  })

  useEffect(() => {
    logger(billingInfo)
  }, [billingInfo])

  return (
    <>
      <SectionTitleStyled>Billing</SectionTitleStyled>
      <Balance billingInfo={billingInfo} isLoading={isLoading} />
      <Divider />
      <Plan subscription={subscription.current} />
      <Divider />
      <PaymentMethod billingInfo={billingInfo} isLoading={isLoading} />
      <Divider />
      <Receipts billingInfo={billingInfo} isLoading={isLoading} />
    </>
  )
}

export { BillingTabContent }
