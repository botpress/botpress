type MoneyV2 = {
  amount: string
  currencyCode: string
}

type StorefrontVariantNode = {
  id: string
  title: string
  availableForSale: boolean
  price: MoneyV2
}

type StorefrontProductNode = {
  id: string
  title: string
  handle: string
  description: string | null
  productType: string | null
  vendor: string | null
  availableForSale: boolean
  onlineStoreUrl: string | null
  priceRange?: {
    minVariantPrice: MoneyV2
    maxVariantPrice: MoneyV2
  }
  variants: { edges: Array<{ node: StorefrontVariantNode }> }
  images: { edges: Array<{ node: { url: string; altText: string | null } }> }
}

type CollectionNode = {
  id: string
  title: string
  handle: string
  description: string | null
  image: { url: string; altText: string | null } | null
}

type CartLineNode = {
  id: string
  quantity: number
  merchandise: {
    id: string
    title: string
    price: MoneyV2
    product: { title: string }
  }
}

export type CartNode = {
  id: string
  checkoutUrl: string
  totalQuantity: number
  cost: {
    totalAmount: MoneyV2
    subtotalAmount: MoneyV2
  }
  lines: { edges: Array<{ node: CartLineNode }> }
  discountCodes?: Array<{ code: string; applicable: boolean }>
}

export const transformStorefrontVariant = (node: StorefrontVariantNode) => ({
  id: node.id,
  title: node.title,
  availableForSale: node.availableForSale,
  price: { amount: node.price.amount, currencyCode: node.price.currencyCode },
})

export const transformStorefrontProduct = (node: StorefrontProductNode, shopDomain: string) => ({
  id: node.id,
  title: node.title,
  handle: node.handle,
  description: node.description ?? undefined,
  productType: node.productType ?? undefined,
  vendor: node.vendor ?? undefined,
  availableForSale: node.availableForSale,
  priceRange: node.priceRange
    ? {
        minVariantPrice: {
          amount: node.priceRange.minVariantPrice.amount,
          currencyCode: node.priceRange.minVariantPrice.currencyCode,
        },
        maxVariantPrice: {
          amount: node.priceRange.maxVariantPrice.amount,
          currencyCode: node.priceRange.maxVariantPrice.currencyCode,
        },
      }
    : undefined,
  variants: node.variants.edges.map(({ node: v }) => transformStorefrontVariant(v)),
  imageUrl: node.images.edges[0]?.node.url ?? undefined,
  storefrontUrl: node.onlineStoreUrl ?? `https://${shopDomain}.myshopify.com/products/${node.handle}`,
  onlineStoreUrl: node.onlineStoreUrl ?? undefined,
})

export const transformCollection = (node: CollectionNode) => ({
  id: node.id,
  title: node.title,
  handle: node.handle,
  description: node.description ?? undefined,
  imageUrl: node.image?.url ?? undefined,
})

export const transformCartLine = (node: CartLineNode) => ({
  lineId: node.id,
  quantity: node.quantity,
  merchandiseId: node.merchandise.id,
  title: node.merchandise.product.title,
  variantTitle: node.merchandise.title ?? undefined,
  price: { amount: node.merchandise.price.amount, currencyCode: node.merchandise.price.currencyCode },
})

export const transformCart = (cart: CartNode) => ({
  cartId: cart.id,
  checkoutUrl: cart.checkoutUrl,
  totalQuantity: cart.totalQuantity,
  totalAmount: { amount: cart.cost.totalAmount.amount, currencyCode: cart.cost.totalAmount.currencyCode },
  subtotalAmount: { amount: cart.cost.subtotalAmount.amount, currencyCode: cart.cost.subtotalAmount.currencyCode },
  lines: cart.lines.edges.map(({ node }) => transformCartLine(node)),
  discountCodes: cart.discountCodes,
})
