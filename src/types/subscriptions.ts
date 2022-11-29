import Stripe from 'stripe'

interface Product {
  id: string /* primary key */
  active?: boolean
  name?: string
  description?: string
  image?: string
  metadata?: Stripe.Metadata
}

interface ProductWithPrice extends Product {
  prices?: Price[]
}

interface UserDetails {
  id: string /* primary key */
  first_name: string
  last_name: string
  full_name?: string
  avatar_url?: string
  billing_address?: Stripe.Address
  payment_method?: Stripe.PaymentMethod[Stripe.PaymentMethod.Type]
}

interface Price {
  id: string /* primary key */
  product_id?: string /* foreign key to products.id */
  active?: boolean
  description?: string
  unit_amount?: number
  currency?: string
  type?: Stripe.Price.Type
  interval?: Stripe.Price.Recurring.Interval
  interval_count?: number
  trial_period_days?: number | null
  metadata?: Stripe.Metadata
  products?: Product
}

interface PriceWithProduct extends Price {}

interface Subscription {
  id: string /* primary key */
  user_id: string
  status?: Stripe.Subscription.Status
  metadata?: Stripe.Metadata
  price_id?: string /* foreign key to prices.id */
  quantity?: number
  cancel_at_period_end?: boolean
  created: string
  current_period_start: string
  current_period_end: string
  ended_at?: string
  cancel_at?: string
  canceled_at?: string
  trial_start?: string
  trial_end?: string
  prices?: Price
}

interface Countries {
  country_code: string /* primary key */
  country_name: string
}

interface CreateSubscriptionProps {
  access_token: string
  priceId: string
  address?: Stripe.Address
}

interface CancelSubscriptionProps {
  access_token: string
  subscriptionId: string
}

interface BillingInfo {
  customer: Stripe.Customer
  card: Stripe.PaymentMethod | null
  invoices: Stripe.Invoice[]
}

export {
  Product,
  Price,
  Subscription,
  Countries,
  CreateSubscriptionProps,
  CancelSubscriptionProps,
  BillingInfo,
}
