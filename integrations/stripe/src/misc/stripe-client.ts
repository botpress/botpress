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

export type StripeClient = {
  createProduct(name: string): Promise<Stripe.Product>

  listProducts(startingAfter?: string): Promise<Stripe.ApiList<Stripe.Product>>

  listAllProductsBasic(startingAfter?: string): Promise<ProductBasic[]>

  createPrice(product: string, unit_amount: number, currency: string): Promise<Stripe.Price>

  createSubsPrice(
    product: string,
    unit_amount: number,
    currency: string,
    recurring: Stripe.PriceCreateParams.Recurring
  ): Promise<Stripe.Price>

  listPrices(productId?: string, isExpand?: boolean, startingAfter?: string): Promise<Stripe.ApiList<Stripe.Price>>

  listAllPricesBasic(productId?: string, isExpand?: boolean, startingAfter?: string): Promise<PriceBasic[]>

  createPaymentLink(lineItem: Stripe.PaymentLinkCreateParams.LineItem): Promise<Stripe.PaymentLink>

  listPaymentLink(startingAfter?: string): Promise<Stripe.ApiList<Stripe.PaymentLink>>

  listAllPaymentLinksBasic(startingAfter?: string): Promise<PaymentLinkBasic[]>

  createSubsLink(
    lineItem: Stripe.PaymentLinkCreateParams.LineItem,
    subscriptionData: Stripe.PaymentLinkCreateParams.SubscriptionData | undefined
  ): Promise<Stripe.PaymentLink>

  deactivatePaymentLink(paymentLinkId: string): Promise<Stripe.PaymentLink>

  listCustomer(email?: string, startingAfter?: string): Promise<Stripe.ApiList<Stripe.Customer>>

  listAllCustomerBasic(email?: string, startingAfter?: string): Promise<CustomerBasic[]>

  searchCustomers(email?: string, name?: string, phone?: string): Promise<Stripe.Customer[]>

  createCustomer(params: Stripe.CustomerCreateParams): Promise<Stripe.Customer>

  createWebhook(webhookData: Stripe.WebhookEndpointCreateParams): Promise<Stripe.WebhookEndpoint>

  listWebhooks(startingAfter?: string): Promise<Stripe.ApiList<Stripe.WebhookEndpoint>>

  listAllWebhooksBasic(startingAfter?: string): Promise<WebhookBasic[]>

  createOrRetrieveWebhookId(webhookData: Stripe.WebhookEndpointCreateParams): Promise<string>

  deleteWebhook(webhookId: string): Promise<Stripe.DeletedWebhookEndpoint>

  retrieveCustomer(id: string): Promise<Stripe.Customer | Stripe.DeletedCustomer>
}
