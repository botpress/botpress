import { afterEach, describe, expect, it, vi } from 'vitest'
import { renewWatchIfExpiring, startWatch } from './watch'

const DAY_MS = 24 * 60 * 60 * 1000
const NOW = new Date('2026-10-01T00:00:00Z').getTime()

afterEach(() => {
  vi.useRealTimers()
})

const _notFound = () => ({ isApiError: true, type: 'ResourceNotFound', message: 'not found' })

const _setup = ({ watchState, getStateError }: { watchState?: object; getStateError?: unknown } = {}) => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
  const setState = vi.fn().mockResolvedValue({})
  const getState =
    getStateError !== undefined
      ? vi.fn().mockRejectedValue(getStateError)
      : vi.fn().mockResolvedValue({ state: { payload: watchState } })
  const watchIncomingMail = vi.fn().mockResolvedValue({ data: { expiration: String(NOW + 7 * DAY_MS) } })
  const googleClient = { watchIncomingMail } as any
  const warn = vi.fn()
  const info = vi.fn()
  return {
    setState,
    watchIncomingMail,
    warn,
    props: {
      client: { getState, setState } as any,
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
      payload: { expiresAtMs: NOW + 7 * DAY_MS, renewedAtMs: NOW },
    })
  })

  it('falls back to a 7-day expiry when Gmail returns none', async () => {
    const { props, setState, watchIncomingMail } = _setup()
    watchIncomingMail.mockResolvedValue({ data: {} })
    await startWatch({ ...props, googleClient: await props.getGoogleClient() })

    expect(setState.mock.calls[0]![0].payload).toEqual({ expiresAtMs: NOW + 7 * DAY_MS, renewedAtMs: NOW })
  })

  it('throws with context when the watch call fails', async () => {
    const { props, watchIncomingMail } = _setup()
    watchIncomingMail.mockRejectedValue(new Error('topic not found'))

    await expect(startWatch({ ...props, googleClient: await props.getGoogleClient() })).rejects.toThrow(
      'Failed to set up Gmail watch: topic not found'
    )
  })
})

describe('renewWatchIfExpiring', () => {
  it('does nothing when the watch was renewed less than a day ago', async () => {
    const { props, watchIncomingMail, setState } = _setup({
      watchState: { renewedAtMs: NOW - DAY_MS / 2, expiresAtMs: NOW + 6.5 * DAY_MS },
    })
    await renewWatchIfExpiring(props)

    expect(watchIncomingMail).not.toHaveBeenCalled()
    expect(setState).not.toHaveBeenCalled()
  })

  it('renews once the watch is a day old', async () => {
    const { props, watchIncomingMail, setState } = _setup({
      watchState: { renewedAtMs: NOW - DAY_MS, expiresAtMs: NOW + 6 * DAY_MS },
    })
    await renewWatchIfExpiring(props)

    expect(watchIncomingMail).toHaveBeenCalledTimes(1)
    expect(setState.mock.calls[0]![0].payload).toEqual({ expiresAtMs: NOW + 7 * DAY_MS, renewedAtMs: NOW })
  })

  it('renews a watch that already expired', async () => {
    const { props, watchIncomingMail } = _setup({
      watchState: { renewedAtMs: NOW - 8 * DAY_MS, expiresAtMs: NOW - DAY_MS },
    })
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
