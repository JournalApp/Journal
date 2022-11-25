import Skeleton, { SkeletonTheme } from 'react-loading-skeleton'
import { HeaderStyled, TextStyled } from './styled'
import type { BillingInfo, PaymentMethodProps } from './types'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.extend(relativeTime)

const Balance = ({ billingInfo, isLoading }: PaymentMethodProps) => {
  return (
    <>
      <HeaderStyled>
        {isLoading ? <Skeleton /> : `$${billingInfo.customer.balance / 100}`}
      </HeaderStyled>
      <TextStyled>Balance</TextStyled>
    </>
  )
}

export { Balance }
