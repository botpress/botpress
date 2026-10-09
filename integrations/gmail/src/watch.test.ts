import { afterEach, describe, expect, it, vi } from 'vitest'
import { ensureDailyRegister, renewWatchIfExpiring, startWatch } from './watch'

const DAY_MS = 24 * 60 * 60 * 1000
const NOW = new Date('2026-10-01T00:00:00Z').getTime()

afterEach(() => {
  vi.useRealTimers()
})

const _notFound = () => ({ isApiError: true, type: 'ResourceNotFound', message: 'not found' })

const _setup = ({ state, getStateError }: { state?: object; getStateError?: unknown } = {}) => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
  const setState = vi.fn().mockResolvedValue({})
  const getState =
    getStateError !== undefined
      ? vi.fn().mockRejectedValue(getStateError)
      : vi.fn().mockResolvedValue({ state: { payload: state } })
  const configureIntegration = vi.fn().mockResolvedValue({})
  const watchIncomingMail = vi.fn().mockResolvedValue({ data: { expiration: String(NOW + 7 * DAY_MS) } })
  const googleClient = { watchIncomingMail } as any
  const warn = vi.fn()
  const info = vi.fn()
  return {
    setState,
    configureIntegration,
    watchIncomingMail,
    warn,
    props: {
      client: { getState, setState, configureIntegration } as any,
      ctx: { integrationId: 'int-1' } as any,
      logger: { forBot: () => ({ warn, info, error: vi.fn(), debug: vi.fn() }) } as any,
      getGoogleClient: async () => googleClient,
    },
  }
}

describe('startWatch', () => {
  it('saves the expiry Gmail returns', async () => {
    const { props, setState } = _setup()
    await startWatch({ ...props, googleClient: await props.getGoogleClient() })

    expect(setState).toHaveBeenCalledWith({
      type: 'integration',
      name: 'watch',
      id: 'int-1',
      payload: { expiresAtMs: NOW + 7 * DAY_MS },
    })
  })

  it('falls back to a 7-day expiry when Gmail returns none', async () => {
    const { props, setState, watchIncomingMail } = _setup()
    watchIncomingMail.mockResolvedValue({ data: {} })
    await startWatch({ ...props, googleClient: await props.getGoogleClient() })

    expect(setState.mock.calls[0]![0].payload).toEqual({ expiresAtMs: NOW + 7 * DAY_MS })
  })

  it('throws with context when the watch call fails', async () => {
    const { props, watchIncomingMail } = _setup()
    watchIncomingMail.mockRejectedValue(new Error('topic not found'))

    await expect(startWatch({ ...props, googleClient: await props.getGoogleClient() })).rejects.toThrow(
      'Failed to set up Gmail watch: topic not found'
    )
  })
})

describe('ensureDailyRegister', () => {
  it('schedules a daily register() call and saves the marker first', async () => {
    const { props, setState, configureIntegration } = _setup({ getStateError: _notFound() })
    await ensureDailyRegister(props)

    expect(configureIntegration).toHaveBeenCalledWith({ scheduleRegisterCall: 'daily' })
    expect(setState).toHaveBeenCalledWith({
      type: 'integration',
      name: 'registerSchedule',
      id: 'int-1',
      payload: { scheduledAtMs: NOW },
    })
    // The marker must be saved before configureIntegration, so a nested register() call skips
    expect(setState.mock.invocationCallOrder[0]!).toBeLessThan(configureIntegration.mock.invocationCallOrder[0]!)
  })

  it('does nothing once the schedule was requested', async () => {
    const { props, setState, configureIntegration } = _setup({ state: { scheduledAtMs: NOW - DAY_MS } })
    await ensureDailyRegister(props)

    expect(configureIntegration).not.toHaveBeenCalled()
    expect(setState).not.toHaveBeenCalled()
  })

  it('clears the marker and does not throw when scheduling fails, so the next register() retries', async () => {
    const { props, setState, configureIntegration, warn } = _setup({ getStateError: _notFound() })
    configureIntegration.mockRejectedValue(new Error('forbidden'))

    await expect(ensureDailyRegister(props)).resolves.toBeUndefined()
    expect(setState.mock.calls.map((c) => c[0].payload)).toEqual([{ scheduledAtMs: NOW }, { scheduledAtMs: 0 }])
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('forbidden'))
  })

  it('retries when a previous attempt cleared the marker', async () => {
    const { props, configureIntegration } = _setup({ state: { scheduledAtMs: 0 } })
    await ensureDailyRegister(props)

    expect(configureIntegration).toHaveBeenCalledTimes(1)
  })
})

describe('renewWatchIfExpiring (backstop)', () => {
  it('does nothing while the watch has more than 2 days left', async () => {
    const { props, watchIncomingMail, setState } = _setup({ state: { expiresAtMs: NOW + 3 * DAY_MS } })
    await renewWatchIfExpiring(props)

    expect(watchIncomingMail).not.toHaveBeenCalled()
    expect(setState).not.toHaveBeenCalled()
  })

  it('renews when the watch expires within 2 days', async () => {
    const { props, watchIncomingMail, setState } = _setup({ state: { expiresAtMs: NOW + DAY_MS } })
    await renewWatchIfExpiring(props)

    expect(watchIncomingMail).toHaveBeenCalledTimes(1)
    expect(setState.mock.calls[0]![0].payload).toEqual({ expiresAtMs: NOW + 7 * DAY_MS })
  })

  it('renews a watch that already expired', async () => {
    const { props, watchIncomingMail } = _setup({ state: { expiresAtMs: NOW - DAY_MS } })
    await renewWatchIfExpiring(props)

    expect(watchIncomingMail).toHaveBeenCalledTimes(1)
  })

  it('renews when no watch state exists yet (integrations set up before this change)', async () => {
    const { props, watchIncomingMail } = _setup({ getStateError: _notFound() })
    await renewWatchIfExpiring(props)

    expect(watchIncomingMail).toHaveBeenCalledTimes(1)
  })

  it('logs and does not throw when renewal fails', async () => {
    const { props, watchIncomingMail, warn } = _setup({ getStateError: _notFound() })
    watchIncomingMail.mockRejectedValue(new Error('quota exceeded'))

    await expect(renewWatchIfExpiring(props)).resolves.toBeUndefined()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('quota exceeded'))
  })

  it('does not renew or throw when the state read fails unexpectedly', async () => {
    const { props, watchIncomingMail, warn } = _setup({ getStateError: new Error('state service unavailable') })

    await expect(renewWatchIfExpiring(props)).resolves.toBeUndefined()
    expect(watchIncomingMail).not.toHaveBeenCalled()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('state service unavailable'))
  })
})
