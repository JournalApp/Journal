import Skeleton, { SkeletonTheme } from 'react-loading-skeleton'
import { HeaderStyled, TextStyled } from './styled'
import { displayAmount } from 'utils'
import type { PaymentMethodProps } from './types'
import dayjs from 'dayjs'
import { theme } from 'themes'
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.extend(relativeTime)

const Balance = ({ billingInfo, isLoading }: PaymentMethodProps) => {
  return (
    <SkeletonTheme baseColor={theme('color.popper.pure', 0.6)} enableAnimation={false}>
      <HeaderStyled>
        {isLoading ? <Skeleton width='40px' /> : displayAmount(-billingInfo.customer.balance)}
      </HeaderStyled>
      <TextStyled>Balance</TextStyled>
    </SkeletonTheme>
  )
}

export { Balance }
