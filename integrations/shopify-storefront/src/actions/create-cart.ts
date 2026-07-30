import { RuntimeError } from '@botpress/sdk'
import { CART_CREATE } from '../client/queries/storefront'
import { StorefrontClient } from '../client/storefront'
import { CartNode, transformCart } from '../transformers'
import * as bp from '.botpress'

type CartCreateResponse = {
  cartCreate: {
    cart: CartNode | null
    userErrors: Array<{ field: string[] | null; message: string }>
  }
}

export const createCart: bp.IntegrationProps['actions']['createCart'] = async ({ input, client, ctx }) => {
  const storefront = await StorefrontClient.create({ client, ctx })

  const cartInput: Record<string, unknown> = {
    lines: input.lines.map((line) => ({
      merchandiseId: line.merchandiseId,
      quantity: line.quantity,
    })),
  }

  if (input.buyerEmail || input.countryCode) {
    cartInput.buyerIdentity = {
      ...(input.buyerEmail && { email: input.buyerEmail }),
      ...(input.countryCode && { countryCode: input.countryCode }),
    }
  }

  if (input.discountCodes?.length) {
    cartInput.discountCodes = input.discountCodes
  }

  if (input.note) {
    cartInput.note = input.note
  }

  const data = await storefront.query<CartCreateResponse>(CART_CREATE, { input: cartInput })

  const userErrors = data.cartCreate.userErrors
  if (userErrors.length) {
    throw new RuntimeError(`Failed to create cart: ${userErrors.map((e) => e.message).join(', ')}`)
  }

  if (!data.cartCreate.cart) {
    throw new RuntimeError('Cart creation returned no cart.')
  }

  return { cart: transformCart(data.cartCreate.cart) }
}
