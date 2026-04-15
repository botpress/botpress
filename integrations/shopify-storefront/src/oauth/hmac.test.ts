import { describe, it, expect } from 'vitest'
import { createHmac } from 'crypto'
import { verifyOAuthCallbackHmac, verifyWebhookHmac } from './hmac'

const SECRET = 'test-shopify-secret'

// Helper: compute the OAuth callback HMAC exactly as the source does
const computeOAuthHmac = (params: Record<string, string>, secret: string): string => {
  const entries = Object.entries(params)
    .filter(([k]) => k !== 'hmac' && k !== 'signature')
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  const message = entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')
  return createHmac('sha256', secret).update(message).digest('hex')
}

// Helper: compute the webhook HMAC exactly as the source does
const computeWebhookHmac = (body: string, secret: string): string =>
  createHmac('sha256', secret).update(body, 'utf8').digest('base64')

describe('verifyOAuthCallbackHmac', () => {
  it('accepts a valid HMAC', () => {
    const params = { code: 'abc123', shop: 'my-store.myshopify.com', state: 'nonce', timestamp: '1234567890' }
    const hmac = computeOAuthHmac(params, SECRET)
    const query = new URLSearchParams({ ...params, hmac })

    expect(verifyOAuthCallbackHmac(query, SECRET)).toBe(true)
  })

  it('returns false when hmac param is missing', () => {
    const query = new URLSearchParams({ code: 'abc123', shop: 'my-store.myshopify.com' })
    expect(verifyOAuthCallbackHmac(query, SECRET)).toBe(false)
  })

  it('returns false with wrong secret', () => {
    const params = { code: 'abc123', shop: 'my-store.myshopify.com' }
    const hmac = computeOAuthHmac(params, SECRET)
    const query = new URLSearchParams({ ...params, hmac })

    expect(verifyOAuthCallbackHmac(query, 'wrong-secret')).toBe(false)
  })

  it('returns false when a query param is tampered', () => {
    const params = { code: 'abc123', shop: 'my-store.myshopify.com' }
    const hmac = computeOAuthHmac(params, SECRET)
    const query = new URLSearchParams({ ...params, hmac, shop: 'evil-store.myshopify.com' })

    // Recompute — the hmac was computed with the original shop value
    expect(verifyOAuthCallbackHmac(query, SECRET)).toBe(false)
  })

  it('excludes signature param from hash input', () => {
    const params = { code: 'abc123', shop: 'my-store.myshopify.com', signature: 'legacy-sig' }
    const hmac = computeOAuthHmac(params, SECRET) // helper already excludes signature
    const query = new URLSearchParams({ ...params, hmac })

    expect(verifyOAuthCallbackHmac(query, SECRET)).toBe(true)
  })

  it('handles params with special characters', () => {
    const params = { code: 'abc=123&456', shop: 'my store.myshopify.com' }
    const hmac = computeOAuthHmac(params, SECRET)
    const query = new URLSearchParams({ ...params, hmac })

    expect(verifyOAuthCallbackHmac(query, SECRET)).toBe(true)
  })
})

describe('verifyWebhookHmac', () => {
  const body = '{"id":12345,"name":"#1001"}'

  it('accepts a valid HMAC', () => {
    const hmac = computeWebhookHmac(body, SECRET)
    expect(verifyWebhookHmac(body, hmac, SECRET)).toBe(true)
  })

  it('returns false with wrong secret', () => {
    const hmac = computeWebhookHmac(body, SECRET)
    expect(verifyWebhookHmac(body, hmac, 'wrong-secret')).toBe(false)
  })

  it('returns false when body is tampered', () => {
    const hmac = computeWebhookHmac(body, SECRET)
    expect(verifyWebhookHmac('{"id":99999}', hmac, SECRET)).toBe(false)
  })

  it('returns false with hex-encoded HMAC instead of base64', () => {
    const hexHmac = createHmac('sha256', SECRET).update(body, 'utf8').digest('hex')
    expect(verifyWebhookHmac(body, hexHmac, SECRET)).toBe(false)
  })

  it('handles empty body', () => {
    const hmac = computeWebhookHmac('', SECRET)
    expect(verifyWebhookHmac('', hmac, SECRET)).toBe(true)
  })

  it('handles unicode body', () => {
    const unicodeBody = '{"name":"Ünïcödé Shöp"}'
    const hmac = computeWebhookHmac(unicodeBody, SECRET)
    expect(verifyWebhookHmac(unicodeBody, hmac, SECRET)).toBe(true)
  })
})
