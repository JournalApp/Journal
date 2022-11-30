import Skeleton, { SkeletonTheme } from 'react-loading-skeleton'
import { Icon } from 'components'
import { theme } from 'themes'
import { AddCard } from '../AddCard'
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
import type { PaymentMethodProps } from './types'
import type { BillingInfo } from 'types'

const PaymentMethod = ({ billingInfo, isLoading, showCardOnly = false }: PaymentMethodProps) => {
  const card = billingInfo?.card

  const Card = () => {
    if (card) {
      const expire = card.card.exp_month + '/' + card.card.exp_year.toString().substring(2)
      const brand = capitalize(card.card.brand)
      const last4 = card.card.last4
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
    <SkeletonTheme baseColor={theme('color.popper.pure', 0.6)} enableAnimation={false}>
      {!showCardOnly && <HeaderStyled>Payment method</HeaderStyled>}
      <ContentStyled>
        <TextStyled>{isLoading ? <Skeleton width='50%' /> : <Card />}</TextStyled>
        {!showCardOnly &&
          (isLoading ? (
            <Skeleton />
          ) : card ? (
            <ActionsStyled>
              <ActionStyled>Update</ActionStyled>
              <ActionStyled>Remove</ActionStyled>
            </ActionsStyled>
          ) : (
            <ActionsStyled>
              <AddCard
                renderTrigger={({ close, ...rest }: any) => (
                  <ActionStyled onClick={close} {...rest}>
                    Add card
                  </ActionStyled>
                )}
              />
            </ActionsStyled>
          ))}
      </ContentStyled>
    </SkeletonTheme>
  )
}

export { PaymentMethod }
