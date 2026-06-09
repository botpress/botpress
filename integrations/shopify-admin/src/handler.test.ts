import { createHmac } from 'crypto'
import { beforeAll, describe, expect, it, vi } from 'vitest'

const SECRET = 'test-shopify-secret'

beforeAll(() => {
  process.env.SECRET_SHOPIFY_CLIENT_ID = 'test-client-id'
  process.env.SECRET_SHOPIFY_CLIENT_SECRET = SECRET
})

vi.mock('./events/order-created', () => ({ fireOrderCreated: vi.fn(async () => ({ status: 200, body: 'ok' })) }))
vi.mock('./events/order-updated', () => ({ fireOrderUpdated: vi.fn(async () => ({ status: 200, body: 'ok' })) }))
vi.mock('./events/order-cancelled', () => ({ fireOrderCancelled: vi.fn(async () => ({ status: 200, body: 'ok' })) }))
vi.mock('./events/order-fulfilled', () => ({ fireOrderFulfilled: vi.fn(async () => ({ status: 200, body: 'ok' })) }))
vi.mock('./events/order-paid', () => ({ fireOrderPaid: vi.fn(async () => ({ status: 200, body: 'ok' })) }))

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

describe('Shopify webhook handler', () => {
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

  it('returns 200 on unknown topic after HMAC passes', async () => {
    const { handler } = await import('./handler')
    const response = await handler(
      buildProps({ topic: 'products/create', hmac: computeHmac(validBody), body: validBody })
    )
    expect(response).toEqual({ status: 200, body: '' })
  })

  // Shopify retries non-2xx responses and disables the webhook after repeated failures, so a
  // malformed payload or a transient event-dispatch error must never escalate into a 4xx/5xx.
  describe('error handling returns 200 to avoid Shopify retry loops', () => {
    it('returns 200 on malformed JSON body after HMAC passes', async () => {
      const malformed = '{not-json'
      const { handler } = await import('./handler')
      const response = await handler(
        buildProps({ topic: 'orders/create', hmac: computeHmac(malformed), body: malformed })
      )
      expect(response).toEqual({ status: 200, body: '' })
    })

    it('returns 200 when an event handler throws', async () => {
      const { fireOrderCreated } = await import('./events/order-created')
      vi.mocked(fireOrderCreated).mockRejectedValueOnce(new Error('createEvent failed'))
      const { handler } = await import('./handler')
      const response = await handler(
        buildProps({ topic: 'orders/create', hmac: computeHmac(validBody), body: validBody })
      )
      expect(response).toEqual({ status: 200, body: '' })
    })
  })
})
