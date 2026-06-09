import { RuntimeError } from '@botpress/sdk'
import { ShopifyClient } from '../client'
import { ORDER_QUERY } from '../client/queries/admin'
import { transformOrder } from '../transformers'
import * as bp from '.botpress'

type VariantShape = {
  id: string
  title: string
  price: string
  sku: string | null
  inventoryQuantity: number | null
}

type OrderQueryResponse = {
  order: {
    id: string
    name: string
    email: string | null
    phone: string | null
    createdAt: string
    updatedAt: string
    cancelledAt: string | null
    closedAt: string | null
    displayFinancialStatus: string | null
    displayFulfillmentStatus: string | null
    totalPriceSet: { shopMoney: { amount: string; currencyCode: string } }
    lineItems: {
      edges: Array<{
        node: {
          title: string
          quantity: number
          variant: VariantShape | null
        }
      }>
    }
    customer: {
      id: string
      firstName: string | null
      lastName: string | null
      email: string | null
      phone: string | null
      createdAt: string
      updatedAt: string
    } | null
  } | null
}

export const getOrder: bp.IntegrationProps['actions']['getOrder'] = async ({ input, client, ctx }) => {
  const shopify = await ShopifyClient.create({ client, ctx })

  const data = await shopify.query<OrderQueryResponse>(ORDER_QUERY, { id: input.orderId })

  if (!data.order) {
    throw new RuntimeError(`Order not found: ${input.orderId}`)
  }

  return { order: transformOrder(data.order) }
}
