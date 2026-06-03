import Stripe from 'stripe'
import { StripeOAuthClient } from './stripe-oauth-client'
import * as bp from '.botpress'

type CreateProps = {
  client: bp.Client
  ctx: bp.Context
  logger: bp.Logger
}

type LegacyConfiguration = bp.Context['configuration'] & {
  apiKey?: string
}

export class StripeClient {
  protected _stripe: Stripe

  public constructor(apiKey: string, apiVersion?: string) {
    // @ts-ignore
    this._stripe = new Stripe(apiKey, { apiVersion: apiVersion || '2023-08-16' })
  }

  public static async createFromStates({ client, ctx, logger }: CreateProps): Promise<StripeClient> {
    const oauth = new StripeOAuthClient({ client, ctx, logger })

    // essential for old API key support
    let accessToken: string
    try {
      accessToken = (await oauth.getAuthState()).accessToken
    } catch (error) {
      const legacyApiKey = (ctx.configuration as LegacyConfiguration).apiKey
      if (!legacyApiKey) {
        throw error
      }

      await oauth.saveManualApiKey(legacyApiKey)
      accessToken = legacyApiKey
    }
    return new StripeClient(accessToken, ctx.configuration.apiVersion)
  }

  public async retrieveAccount(): Promise<Stripe.Account> {
    return await this._stripe.accounts.retrieve()
  }

  public async createProduct(name: string) {
    const product = await this._stripe.products.create({ name })
    return product
  }

  public async listProducts(startingAfter?: string) {
    return await this._stripe.products.list({
      active: true,
      limit: 100,
      starting_after: startingAfter,
    })
  }

  public async listAllProductsBasic(startingAfter?: string) {
    let products = await this.listProducts(startingAfter)
    const productsBasic = products.data.map((product) => ({ id: product.id, name: product.name }))
    while (products.has_more) {
      products = await this.listProducts(productsBasic[productsBasic.length - 1]?.id)
      for (const product of products.data) {
        productsBasic.push({ id: product.id, name: product.name })
      }
    }
    return productsBasic
  }

  public async createPrice(product: string, unit_amount: number, currency: string) {
    return await this._stripe.prices.create({ product, unit_amount, currency })
  }

  public async createSubsPrice(
    product: string,
    unit_amount: number,
    currency: string,
    recurring: Stripe.PriceCreateParams.Recurring
  ) {
    return await this._stripe.prices.create({ product, unit_amount, currency, recurring })
  }

  public async listPrices(productId?: string, isExpand: boolean = false, startingAfter?: string) {
    return await this._stripe.prices.list({
      active: true,
      limit: 100,
      product: productId,
      expand: isExpand ? ['data.product'] : undefined,
      starting_after: startingAfter,
    })
  }

  public async listAllPricesBasic(productId?: string, isExpand: boolean = false, startingAfter?: string) {
    let prices = await this.listPrices(productId, isExpand, startingAfter)
    const pricesBasic = prices.data.map((price) => ({
      id: price.id,
      unit_amount: price.unit_amount,
      currency: price.currency,
      recurring: price.recurring || undefined,
      product: {
        id: (price.product as Stripe.Product).id,
        name: (price.product as Stripe.Product).name,
      },
    }))
    while (prices.has_more) {
      prices = await this.listPrices(productId, isExpand, pricesBasic[pricesBasic.length - 1]?.id)
      for (const price of prices.data) {
        pricesBasic.push({
          id: price.id,
          unit_amount: price.unit_amount,
          currency: price.currency,
          recurring: price.recurring || undefined,
          product: {
            id: (price.product as Stripe.Product).id,
            name: (price.product as Stripe.Product).name,
          },
        })
      }
    }
    return pricesBasic
  }

  public async createPaymentLink(lineItem: Stripe.PaymentLinkCreateParams.LineItem) {
    return await this._stripe.paymentLinks.create({ line_items: [lineItem] })
  }

  public async listPaymentLink(startingAfter?: string) {
    return await this._stripe.paymentLinks.list({
      active: true,
      limit: 100,
      starting_after: startingAfter,
    })
  }

  public async listAllPaymentLinksBasic(startingAfter?: string) {
    let paymentLinks = await this.listPaymentLink(startingAfter)
    const paymentLinksBasic = paymentLinks.data.map((paymentLink) => ({
      id: paymentLink.id,
      url: paymentLink.url,
    }))
    while (paymentLinks.has_more) {
      paymentLinks = await this.listPaymentLink(paymentLinksBasic[paymentLinksBasic.length - 1]?.id)
      for (const paymentLink of paymentLinks.data) {
        paymentLinksBasic.push({ id: paymentLink.id, url: paymentLink.url })
      }
    }
    return paymentLinksBasic
  }

  public async createSubsLink(
    lineItem: Stripe.PaymentLinkCreateParams.LineItem,
    subscriptionData: Stripe.PaymentLinkCreateParams.SubscriptionData | undefined
  ) {
    return await this._stripe.paymentLinks.create({
      line_items: [lineItem],
      subscription_data: subscriptionData,
    })
  }

  public async deactivatePaymentLink(paymentLinkId: string) {
    return this._stripe.paymentLinks.update(paymentLinkId, { active: false })
  }

  public async listCustomer(email?: string, startingAfter?: string) {
    return await this._stripe.customers.list({ email, limit: 100, starting_after: startingAfter })
  }

  public async listAllCustomerBasic(email?: string, startingAfter?: string) {
    let customers = await this.listCustomer(email, startingAfter)
    const customersBasic = customers.data.map((customer) => ({
      id: customer.id,
      email: customer.email,
      name: customer.name,
      description: customer.description,
      phone: customer.phone,
      address: customer.address,
      created: customer.created,
      delinquent: customer.delinquent,
    }))
    while (customers.has_more) {
      customers = await this.listCustomer(email, customersBasic[customersBasic.length - 1]?.id)
      for (const customer of customers.data) {
        customersBasic.push({
          id: customer.id,
          email: customer.email,
          name: customer.name,
          description: customer.description,
          phone: customer.phone,
          address: customer.address,
          created: customer.created,
          delinquent: customer.delinquent,
        })
      }
    }
    return customersBasic
  }

  public async searchCustomers(email?: string, name?: string, phone?: string) {
    const queryParts: string[] = []
    if (email) queryParts.push(`email~'${email}'`)
    if (name) queryParts.push(`name~'${name}'`)
    if (phone) queryParts.push(`phone~'${phone}'`)
    const query = queryParts.join(' AND ')
    const limit = 100

    let response = await this._stripe.customers.search({ query, limit })
    const customers = response.data
    while (response.has_more) {
      const page = response.next_page || undefined
      response = await this._stripe.customers.search({ query, limit, page })
      customers.push(...response.data)
    }
    return customers
  }

  public async createCustomer(params: Stripe.CustomerCreateParams) {
    return await this._stripe.customers.create(params)
  }

  public async createWebhook(webhookData: Stripe.WebhookEndpointCreateParams) {
    return await this._stripe.webhookEndpoints.create(webhookData)
  }

  public async listWebhooks(startingAfter?: string) {
    return await this._stripe.webhookEndpoints.list({ limit: 100, starting_after: startingAfter })
  }

  public async listAllWebhooksBasic(startingAfter?: string) {
    let webhooks = await this.listWebhooks(startingAfter)
    const webhooksBasic = webhooks.data.map((webhook) => ({ id: webhook.id, url: webhook.url }))
    while (webhooks.has_more) {
      webhooks = await this.listWebhooks(webhooksBasic[webhooksBasic.length - 1]?.id)
      for (const webhook of webhooks.data) {
        webhooksBasic.push({ id: webhook.id, url: webhook.url })
      }
    }
    return webhooksBasic
  }

  public async createWebhookEndpointWithSecret(
    webhookData: Stripe.WebhookEndpointCreateParams
  ): Promise<{ id: string; secret: string }> {
    const webhook = await this.createWebhook(webhookData)
    if (!webhook.secret) {
      throw new Error('Stripe did not return a webhook signing secret on creation')
    }
    return { id: webhook.id, secret: webhook.secret }
  }

  public async deleteWebhook(webhookId: string) {
    return await this._stripe.webhookEndpoints.del(webhookId)
  }

  public async retrieveCustomer(id: string) {
    return await this._stripe.customers.retrieve(id)
  }
}
