import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

beforeAll(() => {
  process.env.SECRET_SHOPIFY_CLIENT_ID = 'test-client-id'
  process.env.SECRET_SHOPIFY_CLIENT_SECRET = 'test-client-secret'
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('exchangeCodeForAccessToken', () => {
  it('sends expiring=1 in the JSON body', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ access_token: 'shpat_x' }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const { exchangeCodeForAccessToken } = await import('./index')
    await exchangeCodeForAccessToken({ shop: 'example', code: 'abc' })

    const body = JSON.parse(fetchMock.mock.calls[0]![1].body as string)
    expect(body).toMatchObject({
      client_id: 'test-client-id',
      client_secret: 'test-client-secret',
      code: 'abc',
      expiring: 1,
    })
  })

  it('returns the access_token from the response', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({ access_token: 'shpat_x', expires_in: 3600 }), { status: 200 }))
    )

    const { exchangeCodeForAccessToken } = await import('./index')
    await expect(exchangeCodeForAccessToken({ shop: 'example', code: 'abc' })).resolves.toBe('shpat_x')
  })

  it('throws when access_token is missing from the response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ scope: 'x' }), { status: 200 })))

    const { exchangeCodeForAccessToken } = await import('./index')
    await expect(exchangeCodeForAccessToken({ shop: 'example', code: 'abc' })).rejects.toThrow(/access_token/)
  })
})
