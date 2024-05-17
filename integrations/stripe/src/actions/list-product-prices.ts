import type { Product } from 'src/misc/custom-types'
import { getClient } from '../client'
import type { IntegrationProps } from '../misc/types'

export const listProductPrices: IntegrationProps['actions']['listProductPrices'] = async ({ ctx, logger }) => {
  const StripeClient = getClient(ctx.configuration)
  let response
  try {
    const prices = await StripeClient.listAllPricesBasic(undefined, true)

    prices.map((price) => {
      return {
        productName: (price.product as any).name,
      }
    })

    const products: Record<string, Product> = {}

    for (const price of prices) {
      if (typeof price.product !== 'string' && 'id' in price.product) {
        const product = products[price.product.id]
        if (product) {
          product.prices.push({
            unit_amount: price.unit_amount,
            currency: price.currency,
            recurring: price.recurring,
          })
        } else {
          products[price.product.id] = {
            name: (price.product as any).name,
            prices: [
              {
                unit_amount: price.unit_amount,
                currency: price.currency,
                recurring: price.recurring,
              },
            ],
          }
        }
      }
    }

    response = {
      products,
    }
    logger.forBot().info('Successful - List Product Prices')
  } catch (error) {
    response = {}
    logger.forBot().debug(`'List Product Prices' exception ${JSON.stringify(error)}`)
  }

  return response
}
