import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

beforeAll(() => {
  process.env.SECRET_SHOPIFY_CLIENT_ID = 'test-client-id'
  process.env.SECRET_SHOPIFY_CLIENT_SECRET = 'test-client-secret'
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

const _stubBpClient = (payload: Record<string, unknown>) => {
  const setState = vi.fn().mockResolvedValue({})
  const getState = vi.fn().mockResolvedValue({ state: { payload } })
  return { client: { setState, getState } as any, ctx: { integrationId: 'int-1' } as any, setState, getState }
}

describe('ShopifyClient 401 retry', () => {
  it('refreshes the token and retries once when query gets 401', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-03T00:00:00Z'))
    const nowSeconds = Math.floor(Date.now() / 1000)

    // 1st call (initial query): 401 → triggers refresh
    // 2nd call (refresh endpoint): 200 with new token bundle
    // 3rd call (retry of original query): 200 with data
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('Unauthorized', { status: 401, statusText: 'Unauthorized' }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: 'shpat_new',
            refresh_token: 'shprt_new',
            expires_in: 3600,
            refresh_token_expires_in: 7776000,
          }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { ok: true } }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const { client: bpClient, ctx } = _stubBpClient({
      shopDomain: 'example',
      accessToken: 'shpat_old',
      refreshToken: 'shprt_old',
      accessTokenExpiresAtSeconds: nowSeconds + 3600,
      refreshTokenExpiresAtSeconds: nowSeconds + 7776000,
    })

    const { ShopifyClient } = await import('./index')
    const shopify = new ShopifyClient({ shopDomain: 'example', accessToken: 'shpat_old', client: bpClient, ctx })
    const result = await shopify.query('query { shop { name } }')

    expect(result).toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledTimes(3)

    // First call (failing) used the old token
    const firstCallHeaders = fetchMock.mock.calls[0]![1].headers as Record<string, string>
    expect(firstCallHeaders['X-Shopify-Access-Token']).toBe('shpat_old')

    // Third call (retry) used the refreshed token
    const thirdCallHeaders = fetchMock.mock.calls[2]![1].headers as Record<string, string>
    expect(thirdCallHeaders['X-Shopify-Access-Token']).toBe('shpat_new')
  })

  it('does not retry on 401 when client/ctx are not provided to the constructor', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('Unauthorized', { status: 401, statusText: 'Unauthorized' }))
    vi.stubGlobal('fetch', fetchMock)

    const { ShopifyClient } = await import('./index')
    const shopify = new ShopifyClient({ shopDomain: 'example', accessToken: 'shpat_old' })

    await expect(shopify.query('query { shop { name } }')).rejects.toThrow(/401 Unauthorized/)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
