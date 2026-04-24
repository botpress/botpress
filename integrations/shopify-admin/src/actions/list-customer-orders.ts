import { RuntimeError } from '@botpress/sdk'
import { ShopifyClient } from '../client'
import { CUSTOMER_ORDERS_QUERY } from '../client/queries/admin'
import { transformOrder } from '../transformers'
import * as bp from '.botpress'

type CustomerOrdersQueryResponse = {
  customer: {
    orders: {
      edges: Array<{
        node: {
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
              }
            }>
          }
        }
      }>
    }
  } | null
}

export const listCustomerOrders: bp.IntegrationProps['actions']['listCustomerOrders'] = async ({
  input,
  client,
  ctx,
}) => {
  const shopify = await ShopifyClient.create({ client, ctx })

  const query = input.status && input.status !== 'any' ? `status:${input.status}` : undefined

  const data = await shopify.query<CustomerOrdersQueryResponse>(CUSTOMER_ORDERS_QUERY, {
    customerId: input.customerId,
    first: input.first ?? 50,
    query,
  })

  if (!data.customer) {
    throw new RuntimeError(`Customer not found: ${input.customerId}`)
  }

  return { orders: data.customer.orders.edges.map(({ node }) => transformOrder(node)) }
}
