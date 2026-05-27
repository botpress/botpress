import { createPaymentLinkInputSchema } from '../misc/custom-schemas'
import type { ProductBasic } from '../misc/stripe-client'
import type { IntegrationProps } from '../misc/types'
import { StripeClient } from '../stripe-api/stripe-client'

const findOrCreateProduct = async (stripeClient: StripeClient, productName: string) => {
  const products = await stripeClient.listAllProductsBasic()
  let product = products.find((p: ProductBasic) => p.name === productName)

  if (!product) {
    product = await stripeClient.createProduct(productName)
  }

  return product
}

const findOrCreatePrice = async (
  stripeClient: StripeClient,
  productId: string,
  unitAmount: number,
  currency: string
) => {
  const prices = await stripeClient.listPrices(productId)

  if (!unitAmount) {
    return prices.data[0] || (await stripeClient.createPrice(productId, 0, currency))
  }

  let price = prices.data.find((p) => p.unit_amount === unitAmount && p.currency === currency)

  if (!price) {
    price = await stripeClient.createPrice(productId, unitAmount, currency)
  }

  return price
}

const buildLineItem = (
  priceId: string,
  quantity: number,
  adjustableQuantity: boolean,
  adjustableQuantityMaximum: number,
  adjustableQuantityMinimum: number
) => {
  return {
    price: priceId,
    quantity: quantity || 1,
    adjustable_quantity: {
      enabled: adjustableQuantity || false,
      maximum: adjustableQuantity ? adjustableQuantityMaximum || 99 : undefined,
      minimum: adjustableQuantity ? adjustableQuantityMinimum || 1 : undefined,
    },
  }
}

export const createPaymentLink: IntegrationProps['actions']['createPaymentLink'] = async ({
  ctx,
  client,
  logger,
  input,
}) => {
  const validatedInput = createPaymentLinkInputSchema.parse(input)
  const stripeClient = await StripeClient.createFromStates({ client, ctx, logger })

  try {
    const product = await findOrCreateProduct(stripeClient, validatedInput.productName)
    const price = await findOrCreatePrice(stripeClient, product.id, validatedInput.unit_amount, validatedInput.currency)

    const lineItem = buildLineItem(
      price.id,
      validatedInput.quantity,
      validatedInput.adjustableQuantity,
      validatedInput.adjustableQuantityMaximum,
      validatedInput.adjustableQuantityMinimum
    )

    const paymentLink = await stripeClient.createPaymentLink(lineItem)

    logger.forBot().info(`Successful - Create Payment Link - ${paymentLink.id}`)

    return {
      id: paymentLink.id,
      url: paymentLink.url,
    }
  } catch (error) {
    logger.forBot().debug(`'Create Payment Link' exception ${JSON.stringify(error)}`)
    throw error
  }
}
