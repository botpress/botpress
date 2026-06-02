import type Stripe from 'stripe'

export type ProductBasic = {
  id: string
  name: string
}

export type PriceBasic = {
  id: string
  unit_amount: number | null
  currency: string
  recurring?: Stripe.Price.Recurring
  product: ProductBasic
}

export type CustomerBasic = {
  id: string
  email: string | null
  name: string | null | undefined
  description: string | null
  phone: string | null | undefined
  address: Stripe.Address | null | undefined
  created: number
  delinquent: boolean | null | undefined
}

export type PaymentLinkBasic = {
  id: string
  url: string
}

export type WebhookBasic = {
  id: string
  url: string
}
