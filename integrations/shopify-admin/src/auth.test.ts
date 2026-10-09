import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import {
  exchangeCodeForAccessToken,
  fetchClientCredentialsToken,
  getOrRefreshCredentials,
  refreshAccessToken,
} from './auth'

beforeAll(() => {
  process.env.SECRET_SHOPIFY_CLIENT_ID = 'test-client-id'
  process.env.SECRET_SHOPIFY_CLIENT_SECRET = 'test-client-secret'
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

const _expiringResponse = (overrides: Record<string, unknown> = {}) =>
  new Response(
    JSON.stringify({
      access_token: 'shpat_a',
      refresh_token: 'shprt_r',
      expires_in: 3600,
      refresh_token_expires_in: 7776000,
      scope: 'read_products',
      ...overrides,
    }),
    { status: 200 }
  )

describe('exchangeCodeForAccessToken', () => {
  it('sends expiring=1 in the JSON body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(_expiringResponse())
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

  it('returns the bundle with expiry timestamps computed from expires_in', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-03T00:00:00Z'))
    const nowSeconds = Math.floor(Date.now() / 1000)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(_expiringResponse()))
    const credentials = await exchangeCodeForAccessToken({ shop: 'example', code: 'abc' })

    expect(credentials).toEqual({
      accessToken: 'shpat_a',
      refreshToken: 'shprt_r',
      accessTokenExpiresAtSeconds: nowSeconds + 3600,
      refreshTokenExpiresAtSeconds: nowSeconds + 7776000,
    })
  })

  it('throws when refresh_token is missing in response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(_expiringResponse({ refresh_token: undefined })))
    await expect(exchangeCodeForAccessToken({ shop: 'example', code: 'abc' })).rejects.toThrow(
      /missing one or more required expiring-token fields/
    )
  })

  it('throws on non-2xx with the response body in the message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('Bad client_secret', { status: 401, statusText: 'Unauthorized' }))
    )
    await expect(exchangeCodeForAccessToken({ shop: 'example', code: 'abc' })).rejects.toThrow(
      /401 Unauthorized — Bad client_secret/
    )
  })
})

describe('refreshAccessToken', () => {
  it('sends grant_type=refresh_token and the supplied refresh_token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(_expiringResponse())
    vi.stubGlobal('fetch', fetchMock)
    await refreshAccessToken({ shop: 'example', refreshToken: 'shprt_old' })

    const body = JSON.parse(fetchMock.mock.calls[0]![1].body as string)
    expect(body).toMatchObject({
      client_id: 'test-client-id',
      client_secret: 'test-client-secret',
      grant_type: 'refresh_token',
      refresh_token: 'shprt_old',
    })
  })

  it('returns the rotated bundle from the response', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-03T00:00:00Z'))
    const nowSeconds = Math.floor(Date.now() / 1000)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(_expiringResponse({ access_token: 'shpat_new', refresh_token: 'shprt_new' }))
    )
    const next = await refreshAccessToken({ shop: 'example', refreshToken: 'shprt_old' })

    expect(next).toEqual({
      accessToken: 'shpat_new',
      refreshToken: 'shprt_new',
      accessTokenExpiresAtSeconds: nowSeconds + 3600,
      refreshTokenExpiresAtSeconds: nowSeconds + 7776000,
    })
  })

  it('throws with re-authorize hint on non-2xx', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('refresh_token expired', { status: 401, statusText: 'Unauthorized' }))
    )
    await expect(refreshAccessToken({ shop: 'example', refreshToken: 'shprt_old' })).rejects.toThrow(
      /re-authorize the integration/
    )
  })
})

describe('getOrRefreshCredentials', () => {
  const _stubClient = (payload: Record<string, unknown>) => {
    const setState = vi.fn().mockResolvedValue({})
    const getState = vi.fn().mockResolvedValue({ state: { payload } })
    return { setState, getState, client: { setState, getState } as any, ctx: { integrationId: 'int-1' } as any }
  }

  it('returns stored credentials when access token is well within expiry', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-03T00:00:00Z'))
    const nowSeconds = Math.floor(Date.now() / 1000)
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const { client, ctx } = _stubClient({
      shopDomain: 'example',
      accessToken: 'shpat_a',
      refreshToken: 'shprt_r',
      accessTokenExpiresAtSeconds: nowSeconds + 3600,
      refreshTokenExpiresAtSeconds: nowSeconds + 7776000,
    })
    const creds = await getOrRefreshCredentials({ client, ctx })

    expect(creds.accessToken).toBe('shpat_a')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refreshes when within 5-minute buffer of expiry and persists new credentials', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-03T00:00:00Z'))
    const nowSeconds = Math.floor(Date.now() / 1000)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(_expiringResponse({ access_token: 'shpat_new', refresh_token: 'shprt_new' }))
    )

    const { client, ctx, setState } = _stubClient({
      shopDomain: 'example',
      accessToken: 'shpat_old',
      refreshToken: 'shprt_old',
      accessTokenExpiresAtSeconds: nowSeconds + 60, // within buffer
      refreshTokenExpiresAtSeconds: nowSeconds + 7776000,
    })
    const creds = await getOrRefreshCredentials({ client, ctx })

    expect(creds.accessToken).toBe('shpat_new')
    expect(setState).toHaveBeenCalledTimes(1)
    const setCall = setState.mock.calls[0]![0]
    expect(setCall.payload).toMatchObject({
      shopDomain: 'example',
      accessToken: 'shpat_new',
      refreshToken: 'shprt_new',
    })
  })

  it('throws when refreshToken is missing from state', async () => {
    const { client, ctx } = _stubClient({ shopDomain: 'example', accessToken: 'shpat_a' })
    await expect(getOrRefreshCredentials({ client, ctx })).rejects.toThrow(/credentials not found or incomplete/)
  })

  it('throws when refresh token itself has expired', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-03T00:00:00Z'))
    const nowSeconds = Math.floor(Date.now() / 1000)

    const { client, ctx } = _stubClient({
      shopDomain: 'example',
      accessToken: 'shpat_a',
      refreshToken: 'shprt_r',
      accessTokenExpiresAtSeconds: nowSeconds - 100,
      refreshTokenExpiresAtSeconds: nowSeconds - 1, // expired
    })
    await expect(getOrRefreshCredentials({ client, ctx })).rejects.toThrow(/refresh token expired \(90-day TTL\)/)
  })
})

const _clientCredentialsResponse = (overrides: Record<string, unknown> = {}) =>
  new Response(JSON.stringify({ access_token: 'shpat_cc', scope: 'read_products', expires_in: 86399, ...overrides }), {
    status: 200,
  })

describe('fetchClientCredentialsToken', () => {
  it('sends grant_type=client_credentials as a form-encoded body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(_clientCredentialsResponse())
    vi.stubGlobal('fetch', fetchMock)
    await fetchClientCredentialsToken({ shop: 'example', clientId: 'my-id', clientSecret: 'my-secret' })

    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('https://example.myshopify.com/admin/oauth/access_token')
    expect(init.headers['Content-Type']).toBe('application/x-www-form-urlencoded')
    expect(Object.fromEntries(new URLSearchParams(init.body as string))).toEqual({
      grant_type: 'client_credentials',
      client_id: 'my-id',
      client_secret: 'my-secret',
    })
  })

  it('returns the token with an expiry computed from expires_in', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-03T00:00:00Z'))
    const nowSeconds = Math.floor(Date.now() / 1000)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(_clientCredentialsResponse()))

    const token = await fetchClientCredentialsToken({ shop: 'example', clientId: 'id', clientSecret: 'secret' })
    expect(token).toEqual({ accessToken: 'shpat_cc', accessTokenExpiresAtSeconds: nowSeconds + 86399 })
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
})

describe('getOrRefreshCredentials (manual setup)', () => {
  const _stubManual = (payload: Record<string, unknown>) => {
    const setState = vi.fn().mockResolvedValue({})
    const getState = vi.fn().mockResolvedValue({
      state: {
        payload: {
          authMethod: 'manual',
          shopDomain: 'example',
          clientId: 'my-id',
          clientSecret: 'my-secret',
          ...payload,
        },
      },
    })
    return { setState, client: { setState, getState } as any, ctx: { integrationId: 'int-1' } as any }
  }

  it('returns the cached token when it is well within expiry', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-03T00:00:00Z'))
    const nowSeconds = Math.floor(Date.now() / 1000)
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const { client, ctx } = _stubManual({ accessToken: 'shpat_cached', accessTokenExpiresAtSeconds: nowSeconds + 3600 })
    const creds = await getOrRefreshCredentials({ client, ctx })

    expect(creds).toEqual({ shopDomain: 'example', accessToken: 'shpat_cached' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('fetches a new token with the stored app credentials near expiry and persists it', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-03T00:00:00Z'))
    const nowSeconds = Math.floor(Date.now() / 1000)
    const fetchMock = vi.fn().mockResolvedValue(_clientCredentialsResponse())
    vi.stubGlobal('fetch', fetchMock)

    const { client, ctx, setState } = _stubManual({
      accessToken: 'shpat_old',
      accessTokenExpiresAtSeconds: nowSeconds + 60, // within buffer
    })
    const creds = await getOrRefreshCredentials({ client, ctx })

    expect(creds).toEqual({ shopDomain: 'example', accessToken: 'shpat_cc' })
    const body = Object.fromEntries(new URLSearchParams(fetchMock.mock.calls[0]![1].body as string))
    expect(body).toMatchObject({ client_id: 'my-id', client_secret: 'my-secret' })
    expect(setState.mock.calls[0]![0].payload).toMatchObject({
      authMethod: 'manual',
      clientSecret: 'my-secret',
      accessToken: 'shpat_cc',
      accessTokenExpiresAtSeconds: nowSeconds + 86399,
    })
  })

  it('ignores a cached token when force is set', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-03T00:00:00Z'))
    const nowSeconds = Math.floor(Date.now() / 1000)
    const fetchMock = vi.fn().mockResolvedValue(_clientCredentialsResponse())
    vi.stubGlobal('fetch', fetchMock)

    const { client, ctx } = _stubManual({ accessToken: 'shpat_cached', accessTokenExpiresAtSeconds: nowSeconds + 3600 })
    const creds = await getOrRefreshCredentials({ client, ctx, force: true })

    expect(creds.accessToken).toBe('shpat_cc')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('throws a reconnect hint when the app credentials are missing', async () => {
    const { client, ctx } = _stubManual({ clientSecret: undefined })
    await expect(getOrRefreshCredentials({ client, ctx })).rejects.toThrow(/reconnect the integration via the wizard/)
  })
})
