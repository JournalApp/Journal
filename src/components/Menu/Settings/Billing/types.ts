import Stripe from 'stripe'

interface BillingInfo {
  customer: Stripe.Customer
  card: Stripe.PaymentMethod | null
  invoices: Stripe.Invoice[]
}

interface PaymentMethodProps {
  billingInfo: BillingInfo
  isLoading: boolean
}

export { BillingInfo, PaymentMethodProps }
