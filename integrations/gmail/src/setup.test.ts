import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthorizationCodeSpentError, GoogleClient } from './google-api'
import { register } from './setup'
import type * as bp from '.botpress'

vi.mock('./google-api', () => ({
  GoogleClient: { create: vi.fn(), createFromAuthorizationCode: vi.fn() },
  AuthorizationCodeSpentError: class AuthorizationCodeSpentError extends Error {},
}))

const watchIncomingMail = vi.fn()
const googleClient = { watchIncomingMail } as unknown as GoogleClient
const _props = (configurationType = 'customApp', oauthAuthorizationCode = 'code-1') => {
  const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
  return {
    client: {
      getState: vi.fn().mockResolvedValue({ state: { payload: { refreshToken: 'refresh' } } }),
      patchState: vi.fn().mockResolvedValue({}),
      configureIntegration: vi.fn().mockResolvedValue({}),
    },
    ctx: { integrationId: 'int-1', configurationType, configuration: { oauthAuthorizationCode } },
    logger: { forBot: () => logger },
  } as unknown as Parameters<bp.IntegrationProps['register']>[0]
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(GoogleClient.create).mockResolvedValue(googleClient)
  vi.mocked(GoogleClient.createFromAuthorizationCode).mockResolvedValue(googleClient)
  watchIncomingMail.mockResolvedValue({})
})

describe('register', () => {
  it.each([
    ['', 'code-1'],
    ['customApp', ''],
  ])('uses the saved token for configuration %s with code %s', async (type, code) => {
    await register(_props(type, code))
    expect(GoogleClient.create).toHaveBeenCalledTimes(1)
    expect(GoogleClient.createFromAuthorizationCode).not.toHaveBeenCalled()
    expect(watchIncomingMail).toHaveBeenCalledTimes(1)
  })

  it('exchanges an authorization code before starting the watch', async () => {
    await register(_props())
    expect(GoogleClient.createFromAuthorizationCode).toHaveBeenCalledWith(
      expect.objectContaining({ authorizationCode: 'code-1' })
    )
    expect(GoogleClient.create).not.toHaveBeenCalled()
    expect(watchIncomingMail).toHaveBeenCalledTimes(1)
  })

  it('falls back to the saved token if exchanging the code fails', async () => {
    vi.mocked(GoogleClient.createFromAuthorizationCode).mockRejectedValue(new Error('invalid_grant'))
    await register(_props())
    expect(GoogleClient.create).toHaveBeenCalledTimes(1)
    expect(watchIncomingMail).toHaveBeenCalledTimes(1)
  })

  it('propagates failure when no usable client can be created', async () => {
    vi.mocked(GoogleClient.create).mockRejectedValue(new Error('No refresh token found'))
    await expect(register(_props(''))).rejects.toThrow('No refresh token found')
    expect(watchIncomingMail).not.toHaveBeenCalled()
  })

  it('logs watch failures without failing registration', async () => {
    const props = _props()
    watchIncomingMail.mockRejectedValue(new Error('topic not found'))
    await expect(register(props)).resolves.toBeUndefined()
    expect(props.logger.forBot().warn).toHaveBeenCalledWith('Failed to set up Gmail watch: topic not found')
  })
})

describe('manual authorization codes', () => {
  it('reuses the saved token on consecutive registrations', async () => {
    const props = _props()
    vi.mocked(props.client.getState).mockResolvedValue({
      state: { payload: { refreshToken: 'refresh', authorizationCode: 'code-1' } },
    } as never)
    await register(props)
    await register(props)
    expect(GoogleClient.createFromAuthorizationCode).not.toHaveBeenCalled()
    expect(watchIncomingMail).toHaveBeenCalledTimes(2)
  })

  it('marks a rejected spent code so subsequent runs use the saved token', async () => {
    const props = _props()
    vi.mocked(GoogleClient.createFromAuthorizationCode).mockRejectedValue(
      new AuthorizationCodeSpentError('invalid_grant')
    )
    await register(props)
    expect(props.client.patchState).toHaveBeenCalledWith({
      type: 'integration',
      name: 'configuration',
      id: 'int-1',
      payload: { authorizationCode: 'code-1' },
    })
    expect(watchIncomingMail).toHaveBeenCalledTimes(1)
  })

  it('does not mark a new code as spent on a temporary failure', async () => {
    const props = _props()
    vi.mocked(GoogleClient.createFromAuthorizationCode).mockRejectedValue(new Error('socket hang up'))
    await register(props)
    expect(props.client.patchState).not.toHaveBeenCalled()
  })
})
