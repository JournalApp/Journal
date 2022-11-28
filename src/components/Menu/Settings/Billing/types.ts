import Stripe from 'stripe'
import { BillingInfo } from 'types'

interface PaymentMethodProps {
  billingInfo: BillingInfo
  isLoading: boolean
  showActions?: boolean
}

export { PaymentMethodProps }
