import { describe, expect, it, vi } from 'vitest'
import { ShopifyClient } from './client'
import { register } from './setup'

vi.mock('./client', () => ({ ShopifyClient: { create: vi.fn() } }))

describe('register', () => {
  it('keeps tokens refreshed during webhook subscription when saving the subscription IDs', async () => {
    let n = 0
    vi.mocked(ShopifyClient.create).mockResolvedValue({
      unsubscribeWebhook: vi.fn().mockResolvedValue(undefined),
      subscribeWebhook: vi.fn(async () => `gid://shopify/WebhookSubscription/${++n}`),
    } as any)

    const before = { shopDomain: 'example', accessToken: 'shpat_old', refreshToken: 'shprt_old' }
    // A 401 during subscription forced a refresh, which saved rotated tokens
    const afterRefresh = { shopDomain: 'example', accessToken: 'shpat_new', refreshToken: 'shprt_new' }
    const getState = vi
      .fn()
      .mockResolvedValueOnce({ state: { payload: before } })
      .mockResolvedValueOnce({ state: { payload: afterRefresh } })
    const setState = vi.fn().mockResolvedValue({})
    const noop = () => {}

    await register({
      client: { getState, setState },
      ctx: { integrationId: 'int-1' },
      webhookUrl: 'https://webhook.botpress.cloud/abc',
      logger: { forBot: () => ({ info: noop, warn: noop, error: noop, debug: noop }) },
    } as any)

    expect(setState).toHaveBeenCalledTimes(1)
    expect(setState.mock.calls[0]![0].payload).toEqual({
      ...afterRefresh,
      webhookSubscriptionIds: [1, 2, 3, 4, 5].map((i) => `gid://shopify/WebhookSubscription/${i}`),
    })
  })
})
