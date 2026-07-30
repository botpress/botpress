import { RuntimeError } from '@botpress/sdk'
import { CART_LINES_ADD } from '../client/queries/storefront'
import { StorefrontClient } from '../client/storefront'
import { CartNode, transformCart } from '../transformers'
import * as bp from '.botpress'

type CartLinesAddResponse = {
  cartLinesAdd: {
    cart: CartNode | null
    userErrors: Array<{ field: string[] | null; message: string }>
  }
}

export const addCartLines: bp.IntegrationProps['actions']['addCartLines'] = async ({ input, client, ctx }) => {
  const storefront = await StorefrontClient.create({ client, ctx })

  const data = await storefront.query<CartLinesAddResponse>(CART_LINES_ADD, {
    cartId: input.cartId,
    lines: input.lines.map((line) => ({
      merchandiseId: line.merchandiseId,
      quantity: line.quantity,
    })),
  })

  const userErrors = data.cartLinesAdd.userErrors
  if (userErrors.length) {
    throw new RuntimeError(`Failed to add cart lines: ${userErrors.map((e) => e.message).join(', ')}`)
  }

  if (!data.cartLinesAdd.cart) {
    throw new RuntimeError('cartLinesAdd returned no cart.')
  }

  return { cart: transformCart(data.cartLinesAdd.cart) }
}
