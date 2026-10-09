import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GoogleClient } from './google-api'
import { register } from './setup'
import { ensureDailyRegister, startWatch } from './watch'

vi.mock('./google-api', () => ({
  GoogleClient: { create: vi.fn(), createFromAuthorizationCode: vi.fn() },
}))
vi.mock('./watch', () => ({ startWatch: vi.fn(), ensureDailyRegister: vi.fn() }))

const googleClient = { watchIncomingMail: vi.fn() }

const _props = ({ storedCode }: { storedCode?: string } = {}) => {
  const noop = () => {}
  const patchState = vi.fn().mockResolvedValue({})
  return {
    patchState,
    props: {
      client: {
        getState: vi.fn().mockResolvedValue({
          state: { payload: { refreshToken: 'refresh', authorizationCode: storedCode } },
        }),
        patchState,
      },
      ctx: {
        integrationId: 'int-1',
        configurationType: 'customApp',
        configuration: { oauthAuthorizationCode: 'code-1' },
      },
      logger: { forBot: () => ({ info: noop, warn: noop, error: noop, debug: noop }) },
      webhookUrl: 'https://webhook.botpress.cloud/abc',
    } as any,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(GoogleClient.create).mockResolvedValue(googleClient as any)
  vi.mocked(GoogleClient.createFromAuthorizationCode).mockResolvedValue(googleClient as any)
})

describe('register', () => {
  it('starts the watch and schedules the daily register() call', async () => {
    const { props } = _props({ storedCode: 'code-1' })
    await register(props)

    expect(startWatch).toHaveBeenCalledWith(expect.objectContaining({ googleClient }))
    expect(ensureDailyRegister).toHaveBeenCalledTimes(1)
  })

  it('does not exchange an authorization code that was already used', async () => {
    const { props } = _props({ storedCode: 'code-1' })
    await register(props)

    expect(GoogleClient.createFromAuthorizationCode).not.toHaveBeenCalled()
    expect(GoogleClient.create).toHaveBeenCalledTimes(1)
  })

  it('exchanges a new authorization code', async () => {
    const { props } = _props({ storedCode: 'old-code' })
    await register(props)

    expect(GoogleClient.createFromAuthorizationCode).toHaveBeenCalledWith(
      expect.objectContaining({ authorizationCode: 'code-1' })
    )
  })

  it('records the code as used when the exchange fails but the refresh token works', async () => {
    vi.mocked(GoogleClient.createFromAuthorizationCode).mockRejectedValue(new Error('invalid_grant'))
    const { props, patchState } = _props()
    await register(props)

    expect(GoogleClient.create).toHaveBeenCalledTimes(1)
    expect(patchState).toHaveBeenCalledWith({
      type: 'integration',
      name: 'configuration',
      id: 'int-1',
      payload: { authorizationCode: 'code-1' },
    })
  })
})
