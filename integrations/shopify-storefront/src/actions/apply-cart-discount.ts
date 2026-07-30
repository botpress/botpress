import { RuntimeError } from '@botpress/sdk'
import { CART_DISCOUNT_CODES_UPDATE } from '../client/queries/storefront'
import { StorefrontClient } from '../client/storefront'
import { CartNode, transformCart } from '../transformers'
import * as bp from '.botpress'

type CartDiscountCodesUpdateResponse = {
  cartDiscountCodesUpdate: {
    cart: CartNode | null
    userErrors: Array<{ field: string[] | null; message: string }>
  }
}

export const applyCartDiscount: bp.IntegrationProps['actions']['applyCartDiscount'] = async ({
  input,
  client,
  ctx,
}) => {
  const storefront = await StorefrontClient.create({ client, ctx })

  const data = await storefront.query<CartDiscountCodesUpdateResponse>(CART_DISCOUNT_CODES_UPDATE, {
    cartId: input.cartId,
    discountCodes: input.discountCodes,
  })

  const userErrors = data.cartDiscountCodesUpdate.userErrors
  if (userErrors.length) {
    throw new RuntimeError(`Failed to apply discount codes: ${userErrors.map((e) => e.message).join(', ')}`)
  }

  if (!data.cartDiscountCodesUpdate.cart) {
    throw new RuntimeError('cartDiscountCodesUpdate returned no cart.')
  }

  return { cart: transformCart(data.cartDiscountCodesUpdate.cart) }
}
