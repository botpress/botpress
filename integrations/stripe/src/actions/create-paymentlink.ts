import { getClient } from '../client'
import { createPaymentLinkInputSchema } from '../misc/custom-schemas'
import type { IntegrationProps } from '../misc/types'

export const createPaymentLink: IntegrationProps['actions']['createPaymentLink'] = async ({ ctx, logger, input }) => {
  const validatedInput = createPaymentLinkInputSchema.parse(input)
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
      price = prices.data[0]
    } else {
      price = prices.data.find(
        (p: any) => p.unit_amount === validatedInput.unit_amount && p.currency === validatedInput.currency
      )
    }

    if (!price) {
      price = await StripeClient.createPrice(product.id, validatedInput.unit_amount, validatedInput.currency)
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
    const paymentLink = await StripeClient.createPaymentLink(lineItem)

    response = {
      id: paymentLink.id,
      url: paymentLink.url,
    }
    logger.forBot().info(`Successful - Create Payment Link - ${paymentLink.id}`)
  } catch (error) {
    response = {}
    logger.forBot().debug(`'Create Payment Link' exception ${JSON.stringify(error)}`)
  }

  return response
}
