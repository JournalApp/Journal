import Skeleton, { SkeletonTheme } from 'react-loading-skeleton'
import { Icon } from 'components'
import { theme } from 'themes'
import { logger, capitalize, stripeEpochToDate, isDev } from 'utils'
import {
  HeaderStyled,
  TextStyled,
  ActionsStyled,
  ActionStyled,
  ContentStyled,
  CardStyled,
  ReceiptsRowStyled,
} from './styled'
import type { BillingInfo, PaymentMethodProps } from './types'

const PaymentMethod = ({ billingInfo, isLoading }: PaymentMethodProps) => {
  const Card = () => {
    const { card } = billingInfo
    const expire = card.card.exp_month + '/' + card.card.exp_year.toString().substring(2)
    const brand = capitalize(card.card.brand)
    const last4 = card.card.last4
    if (card) {
      return (
        <CardStyled>
          <Icon name='CardBrand' type={card.card.brand} />
          <em>
            {brand} **** {last4}
          </em>
          expiring {expire}
        </CardStyled>
      )
    }
    return <CardStyled>No card added</CardStyled>
  }

  return (
    <SkeletonTheme baseColor={theme('color.pure', 0.2)} enableAnimation={false}>
      <HeaderStyled>Payment method</HeaderStyled>
      <ContentStyled>
        <TextStyled>{isLoading ? <Skeleton width='50%' /> : <Card />}</TextStyled>
        {isLoading ? (
          <Skeleton />
        ) : (
          <ActionsStyled>
            <ActionStyled>Change</ActionStyled>
            <ActionStyled>Remove</ActionStyled>
          </ActionsStyled>
        )}
      </ContentStyled>
    </SkeletonTheme>
  )
}

export { PaymentMethod }
