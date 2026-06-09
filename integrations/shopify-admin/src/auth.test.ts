import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

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

    const { exchangeCodeForAccessToken } = await import('./auth')
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

    const { exchangeCodeForAccessToken } = await import('./auth')
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

    const { exchangeCodeForAccessToken } = await import('./auth')
    await expect(exchangeCodeForAccessToken({ shop: 'example', code: 'abc' })).rejects.toThrow(
      /missing one or more required expiring-token fields/
    )
  })

  it('throws on non-2xx with the response body in the message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('Bad client_secret', { status: 401, statusText: 'Unauthorized' }))
    )

    const { exchangeCodeForAccessToken } = await import('./auth')
    await expect(exchangeCodeForAccessToken({ shop: 'example', code: 'abc' })).rejects.toThrow(
      /401 Unauthorized — Bad client_secret/
    )
  })
})

describe('refreshAccessToken', () => {
  it('sends grant_type=refresh_token and the supplied refresh_token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(_expiringResponse())
    vi.stubGlobal('fetch', fetchMock)

    const { refreshAccessToken } = await import('./auth')
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

    const { refreshAccessToken } = await import('./auth')
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

    const { refreshAccessToken } = await import('./auth')
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

    const { getOrRefreshCredentials } = await import('./auth')
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

    const { getOrRefreshCredentials } = await import('./auth')
    const creds = await getOrRefreshCredentials({ client, ctx })

    expect(creds.accessToken).toBe('shpat_new')
    expect(creds.refreshToken).toBe('shprt_new')
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

    const { getOrRefreshCredentials } = await import('./auth')
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

    const { getOrRefreshCredentials } = await import('./auth')
    await expect(getOrRefreshCredentials({ client, ctx })).rejects.toThrow(/refresh token expired \(90-day TTL\)/)
  })
})
