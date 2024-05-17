import Stripe from 'stripe'
import { getClient } from '../client'
import { createSubsLinkInputSchema } from '../misc/custom-schemas'
import type { IntegrationProps } from '../misc/types'

export const createSubsLink: IntegrationProps['actions']['createSubsLink'] = async ({ ctx, logger, input }) => {
  const validatedInput = createSubsLinkInputSchema.parse(input)
  const StripeClient = getClient(ctx.configuration)
  let response
  try {
    const products = await StripeClient.listAllProductsBasic()
    let product = products.find((p) => p.name === validatedInput.productName)

    if (!product) {
      product = await StripeClient.createProduct(validatedInput.productName)
    }

    const prices = await StripeClient.listPrices(product.id)
    let price
    if (!validatedInput.unit_amount) {
      price = prices.data.find((p) => p.recurring)
    } else {
      price = prices.data.find(
        (p) => p.unit_amount === validatedInput.unit_amount && p.currency === validatedInput.currency && p.recurring
      )
    }

    const validIntervals = ['day', 'week', 'month', 'year']
    const interval: Stripe.PriceCreateParams.Recurring.Interval = validIntervals.includes(
      validatedInput.chargingInterval
    )
      ? (validatedInput.chargingInterval as Stripe.PriceCreateParams.Recurring.Interval)
      : 'month'

    if (!price) {
      price = await StripeClient.createSubsPrice(product.id, validatedInput.unit_amount, validatedInput.currency, {
        interval,
      })
    }

    const adjustableQuantity = validatedInput.adjustableQuantity || false
    const lineItem = {
      price: price.id,
      quantity: validatedInput.quantity || 1,
      adjustable_quantity: {
        enabled: adjustableQuantity,
        maximum: adjustableQuantity ? validatedInput.adjustableQuantityMaximum || 99 : undefined,
        minimum: adjustableQuantity ? validatedInput.adjustableQuantityMinimum || 1 : undefined,
      },
    }
    const subscriptionData = validatedInput.trial_period_days
      ? {
          description: validatedInput.description,
          trial_period_days: validatedInput.trial_period_days || 1,
        }
      : undefined

    const paymentLink = await StripeClient.createSubsLink(lineItem, subscriptionData)

    response = {
      id: paymentLink.id,
      url: paymentLink.url,
    }

    logger.forBot().info(`Successful - Create Subscription Link - ${paymentLink.id}`)
  } catch (error) {
    response = {}

    logger.forBot().debug(`'Create Subscription Link' exception ${JSON.stringify(error)}`)
  }

  return response
}
