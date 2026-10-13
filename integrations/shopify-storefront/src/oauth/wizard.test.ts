import { beforeAll, describe, it, expect } from 'vitest'
import { normalizeShopDomain, oauthWizardHandler } from './wizard'

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

describe('invalid shop domain page', () => {
  const PAYLOAD = '<img src=x onerror=alert(1)>'

  beforeAll(() => {
    process.env.BP_WEBHOOK_URL = 'https://webhook.botpress.cloud'
  })

  const _renderStep = async (step: string, query: Record<string, string>) => {
    const noop = () => {}
    const response = await oauthWizardHandler({
      req: { path: `/oauth/wizard/${step}`, query: new URLSearchParams(query).toString(), headers: {}, method: 'GET' },
      ctx: { webhookId: 'wh-1', integrationId: 'int-1' },
      client: {},
      logger: { forBot: () => ({ info: noop, warn: noop, error: noop, debug: noop }) },
    } as any)
    return String(response.body)
  }

  it('escapes the domain submitted in the manual credentials form', async () => {
    const body = await _renderStep('save-manual-credentials', {
      'wizform.shopDomain': PAYLOAD,
      'wizform.clientId': 'my-id',
      'wizform.clientSecret': 'my-secret',
    })
    expect(body).toContain('Invalid Shop Domain')
    expect(body).not.toContain('<img')
    expect(body).toContain('&lt;img src=x onerror=alert(1)&gt;')
  })

  it('escapes the domain entered in the OAuth flow', async () => {
    const body = await _renderStep('validate-shop', { wizinput: PAYLOAD })
    expect(body).toContain('Invalid Shop Domain')
    expect(body).not.toContain('<img')
    expect(body).toContain('&lt;img src=x onerror=alert(1)&gt;')
  })
})
