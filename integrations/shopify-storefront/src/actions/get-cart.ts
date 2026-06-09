import { RuntimeError } from '@botpress/sdk'
import { CART_QUERY } from '../client/queries/storefront'
import { StorefrontClient } from '../client/storefront'
import { CartNode, transformCart } from '../transformers'
import * as bp from '.botpress'

type CartQueryResponse = {
  cart: CartNode | null
}

export const getCart: bp.IntegrationProps['actions']['getCart'] = async ({ input, client, ctx }) => {
  const storefront = await StorefrontClient.create({ client, ctx })

  const data = await storefront.query<CartQueryResponse>(CART_QUERY, { id: input.cartId })

  if (!data.cart) {
    throw new RuntimeError(`Cart not found: ${input.cartId}`)
  }

  return { cart: transformCart(data.cart) }
}
