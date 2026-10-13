import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { exchangeCodeForAccessToken, fetchClientCredentialsToken } from './index'

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
    await expect(exchangeCodeForAccessToken({ shop: 'example', code: 'abc' })).resolves.toBe('shpat_x')
  })

  it('throws when access_token is missing from the response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ scope: 'x' }), { status: 200 })))
    await expect(exchangeCodeForAccessToken({ shop: 'example', code: 'abc' })).rejects.toThrow(/access_token/)
  })
})

describe('fetchClientCredentialsToken', () => {
  it('sends grant_type=client_credentials as a form-encoded body', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ access_token: 'shpat_cc', expires_in: 86399 }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const token = await fetchClientCredentialsToken({ shop: 'example', clientId: 'my-id', clientSecret: 'my-secret' })

    expect(token).toBe('shpat_cc')
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('https://example.myshopify.com/admin/oauth/access_token')
    expect(init.headers['Content-Type']).toBe('application/x-www-form-urlencoded')
    expect(Object.fromEntries(new URLSearchParams(init.body as string))).toEqual({
      grant_type: 'client_credentials',
      client_id: 'my-id',
      client_secret: 'my-secret',
    })
  })

  it('throws a credentials hint on non-2xx', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('invalid_client', { status: 400, statusText: 'Bad Request' }))
    )
    await expect(fetchClientCredentialsToken({ shop: 'example', clientId: 'id', clientSecret: 'bad' })).rejects.toThrow(
      /Client ID and Client Secret: 400 Bad Request — invalid_client/
    )
  })

  it('throws when access_token is missing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({}), { status: 200 })))
    await expect(
      fetchClientCredentialsToken({ shop: 'example', clientId: 'id', clientSecret: 'secret' })
    ).rejects.toThrow(/did not return an access_token/)
  })

  it('wraps network failures with the shop for context', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')))
    await expect(
      fetchClientCredentialsToken({ shop: 'example', clientId: 'id', clientSecret: 'secret' })
    ).rejects.toThrow('Failed to get a Shopify access token for example.myshopify.com: fetch failed')
  })
})
