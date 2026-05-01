import { z } from '@botpress/sdk'

export const pageInfoSchema = z.object({
  hasNextPage: z.boolean().title('Has Next Page').describe('Whether there are more results'),
  endCursor: z.string().optional().title('End Cursor').describe('Cursor for the next page'),
})

export const moneySchema = z.object({
  amount: z.string().title('Amount').describe('Decimal money amount'),
  currencyCode: z.string().title('Currency Code').describe('ISO 4217 currency code'),
})

export const storefrontVariantSchema = z.object({
  id: z.string().title('Variant ID').describe('The Storefront GID of the product variant'),
  title: z.string().title('Title').describe('The title of the variant'),
  availableForSale: z.boolean().title('Available for Sale').describe('Whether the variant is available for purchase'),
  price: moneySchema.title('Price').describe('The price of the variant'),
})

export const storefrontProductSchema = z.object({
  id: z.string().title('Product ID').describe('The Storefront GID of the product'),
  title: z.string().title('Title').describe('The title of the product'),
  handle: z.string().title('Handle').describe('The URL-friendly handle of the product'),
  description: z.string().optional().title('Description').describe('Plain-text description of the product'),
  productType: z.string().optional().title('Product Type').describe('The product type'),
  vendor: z.string().optional().title('Vendor').describe('The vendor of the product'),
  availableForSale: z.boolean().title('Available for Sale').describe('Whether the product is available for purchase'),
  priceRange: z
    .object({
      minVariantPrice: moneySchema.title('Min Variant Price'),
      maxVariantPrice: moneySchema.title('Max Variant Price'),
    })
    .optional()
    .title('Price Range')
    .describe('The price range across all variants'),
  variants: z.array(storefrontVariantSchema).title('Variants').describe('The product variants'),
  imageUrl: z.string().optional().title('Image URL').describe('URL of the primary product image'),
  storefrontUrl: z
    .string()
    .title('Storefront URL')
    .describe("Canonical storefront URL on the shop's myshopify.com domain — always populated"),
  onlineStoreUrl: z
    .string()
    .optional()
    .title('Online Store URL')
    .describe(
      'Published Online Store URL (may use a custom domain). Undefined if the product is not published to the Online Store sales channel'
    ),
})

export const collectionSchema = z.object({
  id: z.string().title('Collection ID').describe('The Storefront GID of the collection'),
  title: z.string().title('Title').describe('The title of the collection'),
  handle: z.string().title('Handle').describe('The URL-friendly handle of the collection'),
  description: z.string().optional().title('Description').describe('Plain-text description of the collection'),
  imageUrl: z.string().optional().title('Image URL').describe('URL of the collection image'),
})

export const cartLineSchema = z.object({
  lineId: z.string().title('Line ID').describe('The GID of the cart line'),
  quantity: z.number().title('Quantity').describe('The quantity of this line item'),
  merchandiseId: z.string().title('Merchandise ID').describe('The GID of the product variant'),
  title: z.string().title('Title').describe('The product title'),
  variantTitle: z.string().optional().title('Variant Title').describe('The variant title'),
  price: moneySchema.title('Price').describe('The unit price of the line item'),
})

export const cartSchema = z.object({
  cartId: z.string().title('Cart ID').describe('The Storefront GID of the cart'),
  checkoutUrl: z.string().title('Checkout URL').describe('URL to complete the checkout'),
  totalQuantity: z.number().title('Total Quantity').describe('Total number of items in the cart'),
  totalAmount: moneySchema.title('Total Amount').describe('The estimated total cost'),
  subtotalAmount: moneySchema.title('Subtotal Amount').describe('The estimated subtotal before taxes and shipping'),
  lines: z.array(cartLineSchema).title('Lines').describe('The cart line items'),
  discountCodes: z
    .array(
      z.object({
        code: z.string().title('Code').describe('The discount code'),
        applicable: z.boolean().title('Applicable').describe('Whether the discount code is currently applicable'),
      })
    )
    .optional()
    .title('Discount Codes')
    .describe('Applied discount codes'),
})
