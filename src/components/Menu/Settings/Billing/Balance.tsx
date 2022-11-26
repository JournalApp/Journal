import Skeleton, { SkeletonTheme } from 'react-loading-skeleton'
import { HeaderStyled, TextStyled } from './styled'
import { displayAmount } from 'utils'
import type { BillingInfo, PaymentMethodProps } from './types'
import dayjs from 'dayjs'
import { theme } from 'themes'
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.extend(relativeTime)

const Balance = ({ billingInfo, isLoading }: PaymentMethodProps) => {
  return (
    <SkeletonTheme baseColor={theme('color.pure', 0.2)} enableAnimation={false}>
      <HeaderStyled>
        {isLoading ? <Skeleton width='40px' /> : displayAmount(-billingInfo.customer.balance)}
      </HeaderStyled>
      <TextStyled>Balance</TextStyled>
    </SkeletonTheme>
  )
}

export { Balance }
