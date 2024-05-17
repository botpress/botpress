import Stripe from 'stripe'
import { Configuration } from './misc/types'

export class StripeApi {
  private stripe: Stripe

  constructor(apiKey: string, apiVersion?: string) {
    // @ts-ignore
    this.stripe = new Stripe(apiKey, { apiVersion: apiVersion || '2023-08-16' })
  }

  async createProduct(name: string) {
    const product = await this.stripe.products.create({
      name,
    })
    return product
  }

  async listProducts(startingAfter?: string) {
    const products = await this.stripe.products.list({
      active: true,
      limit: 100,
      starting_after: startingAfter,
    })

    return products
  }

  async listAllProductsBasic(startingAfter?: string) {
    let products = await this.listProducts(startingAfter)
    const productsBasic = products.data.map((product) => {
      return { id: product.id, name: product.name }
    })
    while (products.has_more) {
      products = await this.listProducts(productsBasic[productsBasic.length - 1]?.id)
      for (const product of products.data) {
        productsBasic.push({ id: product.id, name: product.name })
      }
    }
    return productsBasic
  }

  async createPrice(product: string, unit_amount: number, currency: string) {
    const price = await this.stripe.prices.create({
      product,
      unit_amount,
      currency,
    })
    return price
  }

  async createSubsPrice(
    product: string,
    unit_amount: number,
    currency: string,
    recurring: Stripe.PriceCreateParams.Recurring
  ) {
    const price = await this.stripe.prices.create({
      product,
      unit_amount,
      currency,
      recurring,
    })
    return price
  }

  async listPrices(productId?: string, isExpand: boolean = false, startingAfter?: string) {
    const prices = await this.stripe.prices.list({
      active: true,
      limit: 100,
      product: productId,
      expand: isExpand ? ['data.product'] : undefined,
      starting_after: startingAfter,
    })
    return prices
  }

  async listAllPricesBasic(productId?: string, isExpand: boolean = false, startingAfter?: string) {
    let prices = await this.listPrices(productId, isExpand, startingAfter)
    const pricesBasic = prices.data.map((price) => {
      return {
        id: price.id,
        unit_amount: price.unit_amount,
        currency: price.currency,
        recurring: price.recurring || undefined,
        product: {
          id: (price.product as Stripe.Product).id,
          name: (price.product as Stripe.Product).name,
        },
      }
    })
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

  async createPaymentLink(lineItem: Stripe.PaymentLinkCreateParams.LineItem) {
    const paymentLink = await this.stripe.paymentLinks.create({
      line_items: [lineItem],
    })
    return paymentLink
  }

  async listPaymentLink(startingAfter?: string) {
    const paymentLink = await this.stripe.paymentLinks.list({
      active: true,
      limit: 100,
      starting_after: startingAfter,
    })
    return paymentLink
  }

  async listAllPaymentLinksBasic(startingAfter?: string) {
    let paymentLinks = await this.listPaymentLink(startingAfter)
    const paymentLinksBasic = paymentLinks.data.map((paymentLink) => {
      return { id: paymentLink.id, url: paymentLink.url }
    })
    while (paymentLinks.has_more) {
      paymentLinks = await this.listPaymentLink(paymentLinksBasic[paymentLinksBasic.length - 1]?.id)
      for (const paymentLink of paymentLinks.data) {
        paymentLinksBasic.push({ id: paymentLink.id, url: paymentLink.url })
      }
    }
    return paymentLinksBasic
  }

  async createSubsLink(
    lineItem: Stripe.PaymentLinkCreateParams.LineItem,
    subscriptionData: Stripe.PaymentLinkCreateParams.SubscriptionData | undefined
  ) {
    const paymentLink = await this.stripe.paymentLinks.create({
      line_items: [lineItem],
      subscription_data: subscriptionData,
    })
    return paymentLink
  }

  async deactivatePaymentLink(paymentLinkId: string) {
    const paymentLink = this.stripe.paymentLinks.update(paymentLinkId, {
      active: false,
    })
    return paymentLink
  }

  async listCustomer(email?: string, startingAfter?: string) {
    const customers = await this.stripe.customers.list({
      email,
      limit: 100,
      starting_after: startingAfter,
    })
    return customers
  }

  async listAllCustomerBasic(email?: string, startingAfter?: string) {
    let customers = await this.listCustomer(email, startingAfter)
    const customersBasic = customers.data.map((customer) => {
      return {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        description: customer.description,
        phone: customer.phone,
        address: customer.address,
        created: customer.created,
        delinquent: customer.delinquent,
      }
    })
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

  async searchCustomers(email?: string, name?: string, phone?: string) {
    const queryParts: string[] = []

    if (email) {
      queryParts.push(`email~'${email}'`)
    }

    if (name) {
      queryParts.push(`name~'${name}'`)
    }

    if (phone) {
      queryParts.push(`phone~'${phone}'`)
    }

    const query = queryParts.join(' AND ')
    const limit = 100

    let response = await this.stripe.customers.search({
      query,
      limit,
    })

    const customers = response.data
    while (response.has_more) {
      const page = response.next_page || undefined
      response = await this.stripe.customers.search({
        query,
        limit,
        page,
      })
      customers.push(...response.data)
    }
    return customers
  }

  async createCustomer(params: Stripe.CustomerCreateParams) {
    const customer = await this.stripe.customers.create(params)
    return customer
  }

  async createWebhook(webhookData: Stripe.WebhookEndpointCreateParams) {
    const webhook = await this.stripe.webhookEndpoints.create(webhookData)
    return webhook
  }

  async listWebhooks(startingAfter?: string) {
    const webhooks = await this.stripe.webhookEndpoints.list({
      limit: 100,
      starting_after: startingAfter,
    })

    return webhooks
  }

  async listAllWebhooksBasic(startingAfter?: string) {
    let webhooks = await this.listWebhooks(startingAfter)
    const webhooksBasic = webhooks.data.map((webhook) => {
      return {
        id: webhook.id,
        url: webhook.url,
      }
    })
    while (webhooks.has_more) {
      webhooks = await this.listWebhooks(webhooksBasic[webhooksBasic.length - 1]?.id)
      for (const webhook of webhooks.data) {
        webhooksBasic.push({
          id: webhook.id,
          url: webhook.url,
        })
      }
    }
    return webhooksBasic
  }

  async createOrRetrieveWebhookId(webhookData: Stripe.WebhookEndpointCreateParams) {
    const webhooks = await this.listAllWebhooksBasic()
    let webhook = webhooks.find((w) => w.url === webhookData.url)
    if (!webhook) {
      webhook = await this.createWebhook(webhookData)
    }
    return webhook.id
  }

  async deleteWebhook(webhookId: string) {
    const response = await this.stripe.webhookEndpoints.del(webhookId)
    return response
  }

  async retrieveCustomer(id: string) {
    const customer = await this.stripe.customers.retrieve(id)
    return customer
  }
}

export function getClient(config: Configuration) {
  return new StripeApi(config.apiKey, config.apiVersion)
}
