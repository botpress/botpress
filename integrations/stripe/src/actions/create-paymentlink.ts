import { getClient } from '../client'
import { createPaymentLinkInputSchema } from '../misc/custom-schemas'
import type { IntegrationProps } from '../misc/types'

type ProductBasic = {
  id: string
  name: string
}

type PriceBasic = {
  id: string
  unit_amount: number | null
  currency: string
}

const findOrCreateProduct = async (StripeClient: any, productName: string) => {
  const products = await StripeClient.listAllProductsBasic()
  let product = products.find((p: ProductBasic) => p.name === productName)

  if (!product) {
    product = await StripeClient.createProduct(productName)
  }

  return product
}

const findOrCreatePrice = async (StripeClient: any, productId: string, unitAmount: number, currency: string) => {
  const prices = await StripeClient.listPrices(productId)

  if (!unitAmount) {
    return prices.data[0]
  }

  let price = prices.data.find((p: PriceBasic) => p.unit_amount === unitAmount && p.currency === currency)

  if (!price) {
    price = await StripeClient.createPrice(productId, unitAmount, currency)
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

export const createPaymentLink: IntegrationProps['actions']['createPaymentLink'] = async ({ ctx, logger, input }) => {
  const validatedInput = createPaymentLinkInputSchema.parse(input)
  const StripeClient = getClient(ctx.configuration)

  try {
    const product = await findOrCreateProduct(StripeClient, validatedInput.productName)
    const price = await findOrCreatePrice(StripeClient, product.id, validatedInput.unit_amount, validatedInput.currency)

    const lineItem = buildLineItem(
      price.id,
      validatedInput.quantity,
      validatedInput.adjustableQuantity,
      validatedInput.adjustableQuantityMaximum,
      validatedInput.adjustableQuantityMinimum
    )

    const paymentLink = await StripeClient.createPaymentLink(lineItem)

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
