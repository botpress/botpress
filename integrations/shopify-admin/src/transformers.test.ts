import { describe, it, expect } from 'vitest'
import {
  transformVariant,
  transformProduct,
  transformCustomer,
  transformLineItem,
  transformOrder,
  transformOrderWebhookPayload,
} from './transformers'

describe('transformVariant', () => {
  it('maps all fields', () => {
    const result = transformVariant({ id: 'v1', title: 'Small', price: '9.99', sku: 'SKU-1', inventoryQuantity: 10 })
    expect(result).toEqual({ id: 'v1', title: 'Small', price: '9.99', sku: 'SKU-1', inventoryQuantity: 10 })
  })

  it('converts null sku and inventoryQuantity to undefined', () => {
    const result = transformVariant({ id: 'v1', title: 'Small', price: '9.99', sku: null, inventoryQuantity: null })
    expect(result.sku).toBeUndefined()
    expect(result.inventoryQuantity).toBeUndefined()
  })
})

describe('transformProduct', () => {
  const baseProduct = {
    id: 'p1',
    title: 'Widget',
    handle: 'widget',
    status: 'ACTIVE',
    vendor: 'Acme',
    productType: 'Gadget',
    descriptionHtml: '<p>Nice</p>',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-02',
    onlineStoreUrl: 'https://shop.myshopify.com/products/widget',
    onlineStorePreviewUrl: 'https://shop.myshopify.com/products/widget?preview=true',
    variants: { edges: [{ node: { id: 'v1', title: 'Default', price: '10.00', sku: null, inventoryQuantity: 5 } }] },
  }

  it('uses onlineStoreUrl as storefrontUrl when present', () => {
    const result = transformProduct(baseProduct, 'shop')
    expect(result.storefrontUrl).toBe('https://shop.myshopify.com/products/widget')
  })

  it('falls back to onlineStorePreviewUrl when onlineStoreUrl is null', () => {
    const result = transformProduct({ ...baseProduct, onlineStoreUrl: null }, 'shop')
    expect(result.storefrontUrl).toBe('https://shop.myshopify.com/products/widget?preview=true')
  })

  it('falls back to constructed URL when both store URLs are null', () => {
    const result = transformProduct({ ...baseProduct, onlineStoreUrl: null, onlineStorePreviewUrl: null }, 'my-shop')
    expect(result.storefrontUrl).toBe('https://my-shop.myshopify.com/products/widget')
  })

  it('maps variants through transformVariant', () => {
    const result = transformProduct(baseProduct, 'shop')
    expect(result.variants).toEqual([
      { id: 'v1', title: 'Default', price: '10.00', sku: undefined, inventoryQuantity: 5 },
    ])
  })

  it('converts null optional fields to undefined', () => {
    const result = transformProduct({ ...baseProduct, vendor: null, productType: null, descriptionHtml: null }, 'shop')
    expect(result.vendor).toBeUndefined()
    expect(result.productType).toBeUndefined()
    expect(result.descriptionHtml).toBeUndefined()
  })
})

describe('transformCustomer', () => {
  const baseCustomer = {
    id: 'c1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    numberOfOrders: '5',
    amountSpent: { amount: '100.00', currencyCode: 'USD' },
    createdAt: '2024-01-01',
    updatedAt: '2024-01-02',
  }

  it('formats amountSpent as "amount currencyCode"', () => {
    expect(transformCustomer(baseCustomer).amountSpent).toBe('100.00 USD')
  })

  it('coerces numberOfOrders string to number', () => {
    expect(transformCustomer(baseCustomer).numberOfOrders).toBe(5)
  })

  it('coerces numberOfOrders number to number', () => {
    expect(transformCustomer({ ...baseCustomer, numberOfOrders: 3 }).numberOfOrders).toBe(3)
  })

  it('converts null numberOfOrders to undefined', () => {
    expect(transformCustomer({ ...baseCustomer, numberOfOrders: null }).numberOfOrders).toBeUndefined()
  })

  it('converts undefined numberOfOrders to undefined', () => {
    const { numberOfOrders: _, ...rest } = baseCustomer
    expect(transformCustomer(rest as any).numberOfOrders).toBeUndefined()
  })

  it('converts null amountSpent to undefined', () => {
    expect(transformCustomer({ ...baseCustomer, amountSpent: null }).amountSpent).toBeUndefined()
  })

  it('converts null contact fields to undefined', () => {
    const result = transformCustomer({ ...baseCustomer, firstName: null, lastName: null, email: null, phone: null })
    expect(result.firstName).toBeUndefined()
    expect(result.lastName).toBeUndefined()
    expect(result.email).toBeUndefined()
    expect(result.phone).toBeUndefined()
  })
})

describe('transformLineItem', () => {
  it('includes transformed variant when present', () => {
    const result = transformLineItem({
      title: 'Widget',
      quantity: 2,
      variant: { id: 'v1', title: 'Small', price: '5.00', sku: 'S1', inventoryQuantity: 10 },
    })
    expect(result.variant).toEqual({ id: 'v1', title: 'Small', price: '5.00', sku: 'S1', inventoryQuantity: 10 })
  })

  it('converts null variant to undefined', () => {
    expect(transformLineItem({ title: 'Widget', quantity: 2, variant: null }).variant).toBeUndefined()
  })

  it('converts missing variant to undefined', () => {
    expect(transformLineItem({ title: 'Widget', quantity: 2 }).variant).toBeUndefined()
  })
})

describe('transformOrder', () => {
  const baseOrder = {
    id: 'o1',
    name: '#1001',
    email: 'buyer@example.com',
    phone: '+1234567890',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-02',
    cancelledAt: null,
    closedAt: null,
    displayFinancialStatus: 'PAID',
    displayFulfillmentStatus: 'FULFILLED',
    totalPriceSet: { shopMoney: { amount: '50.00', currencyCode: 'USD' } },
    lineItems: {
      edges: [
        {
          node: {
            title: 'Widget',
            quantity: 1,
            variant: { id: 'v1', title: 'Default', price: '50.00', sku: null, inventoryQuantity: null },
          },
        },
      ],
    },
    customer: {
      id: 'c1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: null,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-02',
    },
  }

  it('maps financial and fulfillment statuses', () => {
    const result = transformOrder(baseOrder)
    expect(result.financialStatus).toBe('PAID')
    expect(result.fulfillmentStatus).toBe('FULFILLED')
  })

  it('defaults financialStatus to UNKNOWN when null', () => {
    expect(transformOrder({ ...baseOrder, displayFinancialStatus: null }).financialStatus).toBe('UNKNOWN')
  })

  it('converts null fulfillmentStatus to undefined', () => {
    expect(transformOrder({ ...baseOrder, displayFulfillmentStatus: null }).fulfillmentStatus).toBeUndefined()
  })

  it('transforms nested customer', () => {
    const result = transformOrder(baseOrder)
    expect(result.customer?.id).toBe('c1')
  })

  it('converts null customer to undefined', () => {
    expect(transformOrder({ ...baseOrder, customer: null }).customer).toBeUndefined()
  })

  it('maps line items', () => {
    const result = transformOrder(baseOrder)
    expect(result.lineItems).toHaveLength(1)
    expect(result.lineItems[0]!.title).toBe('Widget')
  })

  it('extracts totalPrice and currencyCode from totalPriceSet', () => {
    const result = transformOrder(baseOrder)
    expect(result.totalPrice).toBe('50.00')
    expect(result.currencyCode).toBe('USD')
  })
})

describe('transformOrderWebhookPayload', () => {
  const basePayload = {
    id: 12345,
    name: '#1001',
    email: 'buyer@example.com',
    financial_status: 'paid',
    fulfillment_status: 'fulfilled',
    total_price: '50.00',
    currency: 'USD',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  }

  it('wraps numeric id as GID string', () => {
    expect(transformOrderWebhookPayload(basePayload).id).toBe('gid://shopify/Order/12345')
  })

  it('maps snake_case fields to camelCase', () => {
    const result = transformOrderWebhookPayload(basePayload)
    expect(result.financialStatus).toBe('paid')
    expect(result.fulfillmentStatus).toBe('fulfilled')
    expect(result.totalPrice).toBe('50.00')
    expect(result.currencyCode).toBe('USD')
    expect(result.createdAt).toBe('2024-01-01T00:00:00Z')
    expect(result.updatedAt).toBe('2024-01-02T00:00:00Z')
  })

  it('defaults financial_status to UNKNOWN when null', () => {
    expect(transformOrderWebhookPayload({ ...basePayload, financial_status: null }).financialStatus).toBe('UNKNOWN')
  })

  it('converts null email and fulfillment_status to undefined', () => {
    const result = transformOrderWebhookPayload({ ...basePayload, email: null, fulfillment_status: null })
    expect(result.email).toBeUndefined()
    expect(result.fulfillmentStatus).toBeUndefined()
  })
})
