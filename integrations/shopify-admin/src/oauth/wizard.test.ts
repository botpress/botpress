import { describe, it, expect } from 'vitest'
import { normalizeShopDomain } from './wizard'

describe('normalizeShopDomain', () => {
  it('returns bare domain as-is', () => {
    expect(normalizeShopDomain('my-store')).toBe('my-store')
  })

  it('strips .myshopify.com suffix', () => {
    expect(normalizeShopDomain('my-store.myshopify.com')).toBe('my-store')
  })

  it('strips https:// protocol', () => {
    expect(normalizeShopDomain('https://my-store.myshopify.com')).toBe('my-store')
  })

  it('strips http:// protocol', () => {
    expect(normalizeShopDomain('http://my-store.myshopify.com')).toBe('my-store')
  })

  it('strips trailing slash', () => {
    expect(normalizeShopDomain('https://my-store.myshopify.com/')).toBe('my-store')
  })

  it('strips path segments', () => {
    expect(normalizeShopDomain('https://my-store.myshopify.com/admin')).toBe('my-store')
  })

  it('strips deep path segments', () => {
    expect(normalizeShopDomain('https://my-store.myshopify.com/admin/products/123')).toBe('my-store')
  })

  it('trims whitespace', () => {
    expect(normalizeShopDomain('  my-store.myshopify.com  ')).toBe('my-store')
  })

  it('lowercases input', () => {
    expect(normalizeShopDomain('MY-STORE.MYSHOPIFY.COM')).toBe('my-store')
  })

  it('handles full URL with mixed case and whitespace', () => {
    expect(normalizeShopDomain('  HTTPS://MY-STORE.MYSHOPIFY.COM/admin/products  ')).toBe('my-store')
  })
})
