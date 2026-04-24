import { ShopifyClient } from '../client'
import { CUSTOMERS_QUERY } from '../client/queries/admin'
import { transformCustomer } from '../transformers'
import * as bp from '.botpress'

type CustomersQueryResponse = {
  customers: {
    edges: Array<{
      node: {
        id: string
        firstName: string | null
        lastName: string | null
        email: string | null
        phone: string | null
        numberOfOrders: string | null
        amountSpent: { amount: string; currencyCode: string } | null
        createdAt: string
        updatedAt: string
      }
    }>
  }
}

export const searchCustomers: bp.IntegrationProps['actions']['searchCustomers'] = async ({ input, client, ctx }) => {
  const shopify = await ShopifyClient.create({ client, ctx })

  const data = await shopify.query<CustomersQueryResponse>(CUSTOMERS_QUERY, { query: input.query })

  return { customers: data.customers.edges.map(({ node }) => transformCustomer(node)) }
}
