import { z, IntegrationDefinitionProps } from '@botpress/sdk'
import { storefrontProductSchema, collectionSchema, cartSchema, pageInfoSchema } from './schemas'

export const actions = {
  searchProducts: {
    title: 'Search Products',
    description: 'Search public-facing products via the Shopify Storefront API',
    input: {
      schema: z.object({
        query: z.string().title('Search Query').describe('Search term to find products'),
        first: z
          .number()
          .min(1)
          .max(250)
          .default(50)
          .optional()
          .title('Limit')
          .describe('Number of products to return'),
        after: z.string().optional().title('After Cursor').describe('Cursor for pagination'),
      }),
    },
    output: {
      schema: z.object({
        products: z.array(storefrontProductSchema).title('Products').describe('List of matching products'),
        pageInfo: pageInfoSchema.title('Page Info').describe('Pagination info'),
      }),
    },
  },

  getProduct: {
    title: 'Get Product',
    description: 'Get a single product from the Shopify Storefront API by handle or ID',
    input: {
      schema: z.object({
        handle: z.string().optional().title('Handle').describe('The URL-friendly handle of the product'),
        productId: z
          .string()
          .optional()
          .title('Product ID')
          .describe('The Storefront GID of the product (e.g. gid://shopify/Product/12345)'),
      }),
    },
    output: {
      schema: z.object({
        product: storefrontProductSchema.title('Product').describe('The product details'),
      }),
    },
  },

  listCollections: {
    title: 'List Collections',
    description: 'List collections from the Shopify Storefront API',
    input: {
      schema: z.object({
        first: z
          .number()
          .min(1)
          .max(250)
          .default(50)
          .optional()
          .title('Limit')
          .describe('Number of collections to return'),
        after: z.string().optional().title('After Cursor').describe('Cursor for pagination'),
      }),
    },
    output: {
      schema: z.object({
        collections: z.array(collectionSchema).title('Collections').describe('List of collections'),
        pageInfo: pageInfoSchema.title('Page Info').describe('Pagination info'),
      }),
    },
  },

  getCollection: {
    title: 'Get Collection',
    description: 'Get a single collection with its products from the Shopify Storefront API',
    input: {
      schema: z.object({
        handle: z.string().optional().title('Handle').describe('The URL-friendly handle of the collection'),
        collectionId: z
          .string()
          .optional()
          .title('Collection ID')
          .describe('The Storefront GID of the collection (e.g. gid://shopify/Collection/12345)'),
        productsFirst: z
          .number()
          .min(0)
          .max(250)
          .default(50)
          .optional()
          .title('Products Limit')
          .describe('Number of products to include'),
      }),
    },
    output: {
      schema: z.object({
        collection: collectionSchema.title('Collection').describe('The collection details'),
        products: z.array(storefrontProductSchema).title('Products').describe('Products in the collection'),
        pageInfo: pageInfoSchema.title('Page Info').describe('Pagination info for products'),
      }),
    },
  },

  createCart: {
    title: 'Create Cart',
    description: 'Create a new cart via the Shopify Storefront API',
    input: {
      schema: z.object({
        lines: z
          .array(
            z.object({
              merchandiseId: z.string().title('Merchandise ID').describe('The Storefront GID of the product variant'),
              quantity: z.number().min(1).title('Quantity').describe('The quantity to add'),
            })
          )
          .title('Lines')
          .describe('Cart line items to add'),
        buyerEmail: z.string().optional().title('Buyer Email').describe('Email of the buyer'),
        countryCode: z
          .string()
          .optional()
          .title('Country Code')
          .describe('ISO 3166-1 alpha-2 country code for the buyer'),
        discountCodes: z.array(z.string()).optional().title('Discount Codes').describe('Discount codes to apply'),
        note: z.string().optional().title('Note').describe('A note for the cart'),
      }),
    },
    output: {
      schema: z.object({
        cart: cartSchema.title('Cart').describe('The created cart'),
      }),
    },
  },

  getCart: {
    title: 'Get Cart',
    description: 'Retrieve a cart by ID from the Shopify Storefront API',
    input: {
      schema: z.object({
        cartId: z.string().title('Cart ID').describe('The Storefront GID of the cart'),
      }),
    },
    output: {
      schema: z.object({
        cart: cartSchema.title('Cart').describe('The cart details'),
      }),
    },
  },

  addCartLines: {
    title: 'Add Cart Lines',
    description: 'Add line items to an existing cart via the Shopify Storefront API',
    input: {
      schema: z.object({
        cartId: z.string().title('Cart ID').describe('The Storefront GID of the cart'),
        lines: z
          .array(
            z.object({
              merchandiseId: z.string().title('Merchandise ID').describe('The Storefront GID of the product variant'),
              quantity: z.number().min(1).title('Quantity').describe('The quantity to add'),
            })
          )
          .title('Lines')
          .describe('Line items to add to the cart'),
      }),
    },
    output: {
      schema: z.object({
        cart: cartSchema.title('Cart').describe('The updated cart'),
      }),
    },
  },

  applyCartDiscount: {
    title: 'Apply Cart Discount',
    description: 'Apply or update discount codes on a cart via the Shopify Storefront API',
    input: {
      schema: z.object({
        cartId: z.string().title('Cart ID').describe('The Storefront GID of the cart'),
        discountCodes: z.array(z.string()).title('Discount Codes').describe('Discount codes to apply to the cart'),
      }),
    },
    output: {
      schema: z.object({
        cart: cartSchema.title('Cart').describe('The updated cart'),
      }),
    },
  },
} satisfies IntegrationDefinitionProps['actions']
