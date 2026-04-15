import { createHmac } from 'crypto'
import { beforeAll, describe, expect, it } from 'vitest'

const SECRET = 'test-shopify-secret'

beforeAll(() => {
  process.env.SECRET_SHOPIFY_CLIENT_ID = 'test-client-id'
  process.env.SECRET_SHOPIFY_CLIENT_SECRET = SECRET
})

const computeHmac = (body: string) => createHmac('sha256', SECRET).update(body, 'utf8').digest('base64')

const buildProps = (opts: { topic?: string; hmac?: string; body?: string; path?: string }) => {
  const body = opts.body ?? '{}'
  const headers: Record<string, string> = {}
  if (opts.topic !== undefined) headers['x-shopify-topic'] = opts.topic
  if (opts.hmac !== undefined) headers['x-shopify-hmac-sha256'] = opts.hmac
  const noop = () => {}
  const forBot = () => ({ info: noop, warn: noop, error: noop, debug: noop })
  return {
    req: { path: opts.path ?? '/', headers, body },
    logger: { forBot },
  } as any
}

describe('Shopify Storefront webhook handler', () => {
  const validBody = '{"shop_id":1,"shop_domain":"x.myshopify.com"}'

  describe('GDPR compliance topics', () => {
    const topics = ['customers/data_request', 'customers/redact', 'shop/redact']

    for (const topic of topics) {
      it(`returns 200 on valid HMAC for ${topic}`, async () => {
        const { handler } = await import('./handler')
        const response = await handler(buildProps({ topic, hmac: computeHmac(validBody), body: validBody }))
        expect(response).toEqual({ status: 200, body: '' })
      })

      it(`returns 401 on invalid HMAC for ${topic}`, async () => {
        const { handler } = await import('./handler')
        const response = await handler(buildProps({ topic, hmac: 'invalid-hmac', body: validBody }))
        expect(response).toMatchObject({ status: 401 })
      })
    }
  })

  describe('request validation', () => {
    it('returns 400 when topic header is missing', async () => {
      const { handler } = await import('./handler')
      const response = await handler(buildProps({ hmac: computeHmac(validBody), body: validBody }))
      expect(response).toMatchObject({ status: 400 })
    })

    it('returns 400 when hmac header is missing', async () => {
      const { handler } = await import('./handler')
      const response = await handler(buildProps({ topic: 'customers/redact', body: validBody }))
      expect(response).toMatchObject({ status: 400 })
    })
  })

  it('falls through on unknown topic after HMAC passes', async () => {
    const { handler } = await import('./handler')
    const response = await handler(
      buildProps({ topic: 'products/create', hmac: computeHmac(validBody), body: validBody })
    )
    expect(response).toBeUndefined()
  })
})
