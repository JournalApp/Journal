import Skeleton, { SkeletonTheme } from 'react-loading-skeleton'
import { logger, capitalize, stripeEpochToDate, isDev } from 'utils'
import { theme } from 'themes'
import {
  HeaderStyled,
  TextStyled,
  ActionsStyled,
  ActionStyled,
  ContentStyled,
  CardStyled,
  ReceiptsRowStyled,
  ReceiptsTableStyled,
  ReceiptsCellStyled,
  DownloadStyled,
} from './styled'
import type { BillingInfo, PaymentMethodProps } from './types'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.extend(relativeTime)

const Receipts = ({ billingInfo, isLoading }: PaymentMethodProps) => {
  const Items = () => {
    const { invoices } = billingInfo
    return (
      <ReceiptsTableStyled>
        {invoices
          .filter((invoice) => invoice.status == 'paid')
          .map((invoice) => {
            return (
              <ReceiptsRowStyled key={invoice.id}>
                <ReceiptsCellStyled>
                  {dayjs(stripeEpochToDate(invoice.period_start)).format('MMM D YYYY') +
                    ' - ' +
                    dayjs(stripeEpochToDate(invoice.period_end)).format('MMM D YYYY')}
                </ReceiptsCellStyled>
                <ReceiptsCellStyled>{capitalize(invoice.status)}</ReceiptsCellStyled>
                <ReceiptsCellStyled>
                  <DownloadStyled href={invoice.invoice_pdf}>PDF↓</DownloadStyled>
                </ReceiptsCellStyled>
              </ReceiptsRowStyled>
            )
          })}
      </ReceiptsTableStyled>
    )
  }

  return (
    <SkeletonTheme baseColor={theme('color.pure', 0.2)} enableAnimation={false}>
      <HeaderStyled>Receipts</HeaderStyled>
      <TextStyled>{isLoading ? <Skeleton count={3} /> : <Items />}</TextStyled>
    </SkeletonTheme>
  )
}

export { Receipts }
