import { describe, it, expect } from 'vitest'
import {
  transformStorefrontVariant,
  transformStorefrontProduct,
  transformCollection,
  transformCartLine,
  transformCart,
} from './transformers'

describe('transformStorefrontVariant', () => {
  it('maps price as {amount, currencyCode}', () => {
    const result = transformStorefrontVariant({
      id: 'sv1',
      title: 'Small',
      availableForSale: true,
      price: { amount: '19.99', currencyCode: 'CAD' },
    })
    expect(result).toEqual({
      id: 'sv1',
      title: 'Small',
      availableForSale: true,
      price: { amount: '19.99', currencyCode: 'CAD' },
    })
  })
})

describe('transformStorefrontProduct', () => {
  const baseProduct = {
    id: 'sp1',
    title: 'Widget',
    handle: 'widget',
    description: 'A widget',
    productType: 'Gadget',
    vendor: 'Acme',
    availableForSale: true,
    onlineStoreUrl: 'https://shop.myshopify.com/products/widget',
    priceRange: {
      minVariantPrice: { amount: '10.00', currencyCode: 'USD' },
      maxVariantPrice: { amount: '20.00', currencyCode: 'USD' },
    },
    variants: {
      edges: [
        {
          node: {
            id: 'sv1',
            title: 'Default',
            availableForSale: true,
            price: { amount: '15.00', currencyCode: 'USD' },
          },
        },
      ],
    },
    images: { edges: [{ node: { url: 'https://cdn.shopify.com/image.jpg', altText: 'Widget' } }] },
  }

  it('extracts imageUrl from first image edge', () => {
    expect(transformStorefrontProduct(baseProduct, 'shop').imageUrl).toBe('https://cdn.shopify.com/image.jpg')
  })

  it('returns undefined imageUrl when images are empty', () => {
    expect(transformStorefrontProduct({ ...baseProduct, images: { edges: [] } }, 'shop').imageUrl).toBeUndefined()
  })

  it('maps priceRange when present', () => {
    const result = transformStorefrontProduct(baseProduct, 'shop')
    expect(result.priceRange).toEqual({
      minVariantPrice: { amount: '10.00', currencyCode: 'USD' },
      maxVariantPrice: { amount: '20.00', currencyCode: 'USD' },
    })
  })

  it('returns undefined priceRange when absent', () => {
    const { priceRange: _, ...noRange } = baseProduct
    expect(transformStorefrontProduct(noRange, 'shop').priceRange).toBeUndefined()
  })

  it('converts null optional fields to undefined', () => {
    const result = transformStorefrontProduct(
      { ...baseProduct, description: null, productType: null, vendor: null },
      'shop'
    )
    expect(result.description).toBeUndefined()
    expect(result.productType).toBeUndefined()
    expect(result.vendor).toBeUndefined()
  })

  it('uses onlineStoreUrl as storefrontUrl when present', () => {
    const result = transformStorefrontProduct(baseProduct, 'shop')
    expect(result.storefrontUrl).toBe('https://shop.myshopify.com/products/widget')
  })

  it('falls back to constructed URL when onlineStoreUrl is null', () => {
    const result = transformStorefrontProduct({ ...baseProduct, onlineStoreUrl: null }, 'my-shop')
    expect(result.storefrontUrl).toBe('https://my-shop.myshopify.com/products/widget')
  })
})

describe('transformCollection', () => {
  it('maps all fields', () => {
    const result = transformCollection({
      id: 'col1',
      title: 'Summer',
      handle: 'summer',
      description: 'Summer collection',
      image: { url: 'https://cdn.shopify.com/col.jpg', altText: 'Summer' },
    })
    expect(result).toEqual({
      id: 'col1',
      title: 'Summer',
      handle: 'summer',
      description: 'Summer collection',
      imageUrl: 'https://cdn.shopify.com/col.jpg',
    })
  })

  it('converts null image to undefined imageUrl', () => {
    expect(
      transformCollection({ id: 'col1', title: 'Summer', handle: 'summer', description: null, image: null }).imageUrl
    ).toBeUndefined()
  })
})

describe('transformCartLine', () => {
  it('maps merchandise fields', () => {
    const result = transformCartLine({
      id: 'line1',
      quantity: 2,
      merchandise: {
        id: 'merch1',
        title: 'Small',
        price: { amount: '25.00', currencyCode: 'USD' },
        product: { title: 'Widget' },
      },
    })
    expect(result).toEqual({
      lineId: 'line1',
      quantity: 2,
      merchandiseId: 'merch1',
      title: 'Widget',
      variantTitle: 'Small',
      price: { amount: '25.00', currencyCode: 'USD' },
    })
  })
})

describe('transformCart', () => {
  const baseCart = {
    id: 'cart1',
    checkoutUrl: 'https://shop.myshopify.com/cart/checkout',
    totalQuantity: 3,
    cost: {
      totalAmount: { amount: '75.00', currencyCode: 'USD' },
      subtotalAmount: { amount: '70.00', currencyCode: 'USD' },
    },
    lines: {
      edges: [
        {
          node: {
            id: 'line1',
            quantity: 3,
            merchandise: {
              id: 'merch1',
              title: 'Default',
              price: { amount: '25.00', currencyCode: 'USD' },
              product: { title: 'Widget' },
            },
          },
        },
      ],
    },
    discountCodes: [{ code: 'SAVE10', applicable: true }],
  }

  it('maps cart structure', () => {
    const result = transformCart(baseCart)
    expect(result.cartId).toBe('cart1')
    expect(result.totalQuantity).toBe(3)
    expect(result.totalAmount).toEqual({ amount: '75.00', currencyCode: 'USD' })
    expect(result.subtotalAmount).toEqual({ amount: '70.00', currencyCode: 'USD' })
  })

  it('maps cart lines', () => {
    expect(transformCart(baseCart).lines).toHaveLength(1)
    expect(transformCart(baseCart).lines[0]!.title).toBe('Widget')
  })

  it('passes through discountCodes', () => {
    expect(transformCart(baseCart).discountCodes).toEqual([{ code: 'SAVE10', applicable: true }])
  })

  it('handles undefined discountCodes', () => {
    const { discountCodes: _, ...noDiscount } = baseCart
    expect(transformCart(noDiscount).discountCodes).toBeUndefined()
  })
})
